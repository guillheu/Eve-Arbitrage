import arbitrage
import config/esi
import config/sde
import gleam/bool
import gleam/dict
import gleam/float
import gleam/io
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import lustre/effect
import mvu
import mvu/update/side_effects/clipboard
import mvu/update/side_effects/fetch_esi
import pprint
import rsvp

pub fn user_clicked_copy_multibuy(
  model: mvu.Model,
  multibuy: arbitrage.Multibuy,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let multibuy_text = arbitrage.multibuy_to_string(multibuy)
  let side_effect = clipboard.write(multibuy_text)
  io.println("Multibuy copied to clipboard")
  #(model, side_effect)
}

pub fn user_clicked_compute_multibuys(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  use <- bool.guard(
    model.source |> option.is_none || model.destination |> option.is_none,
    #(model, effect.none()),
  )

  let assert Some(source) = model.source
  let assert Some(dest) = model.destination
  let assert Ok(source) = dict.get(model.systems, source)
  let assert Ok(dest) = dict.get(model.systems, dest)

  let raw_trades =
    arbitrage.compute_trades(
      source.sell_orders,
      dest.buy_orders,
      model.accounting_level |> arbitrage.tax_percent_from_accounting_level,
    )

  let model = mvu.Model(..model, trades: list.map(raw_trades, mvu.RawTrade))

  let effect =
    raw_trades
    |> list.map(fn(trade) { trade.item })
    |> list.unique
    |> list.map(fetch_esi.get_query_type_metadata_side_effect)
    |> effect.batch

  #(model, effect)
}

pub fn esi_returned_type_metadata(
  model: mvu.Model,
  esi_response: Result(esi.Type, rsvp.Error),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case esi_response {
    Error(e) -> {
      io.println_error(e |> string.inspect)
      #(model, effect.none())
    }
    Ok(type_metadata) -> {
      let new_trades =
        model.trades
        |> list.map(fn(trade) {
          case trade {
            mvu.RawTrade(raw_trade) -> {
              case raw_trade.item == type_metadata.type_id {
                False -> raw_trade |> mvu.RawTrade
                True ->
                  arbitrage.raw_trade_to_trade(raw_trade, type_metadata)
                  |> result.map(mvu.Trade)
                  |> result.unwrap(raw_trade |> mvu.RawTrade)
              }
            }
            any -> any
          }
        })
      let possibly_multibuys = case
        list.all(new_trades, fn(trade) {
          case trade {
            mvu.Trade(_) -> True
            _ -> False
          }
        })
      {
        True -> {
          let assert Some(current_ship) = model.current_ship
          let assert Some(collateral) = model.collateral
          let trades =
            list.map(new_trades, fn(trade) {
              let assert mvu.Trade(trade) = trade
              trade
            })
          let assert Ok(selected_ship) = dict.get(model.ships, current_ship)
          arbitrage.trades_to_multibuys(
            trades,
            collateral,
            selected_ship.ship.holds |> dict.values,
          )
          |> list.map(mvu.Multibuy)
        }
        _ -> new_trades
      }
      let model = mvu.Model(..model, trades: possibly_multibuys)
      #(model, effect.none())
    }
  }
}
