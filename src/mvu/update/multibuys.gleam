import arbitrage
import config/esi
import config/sde
import gleam/bool
import gleam/dict
import gleam/io
import gleam/list
import gleam/option.{Some}
import lustre/effect
import mvu
import mvu/update/side_effects/clipboard
import mvu/update/side_effects/compute_multibuys

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
  let assert Some(current_ship) = model.current_ship
  let assert Some(collateral) = model.collateral
  let assert Ok(selected_ship) = dict.get(model.ships, current_ship)

  // let trades =
  //   arbitrage.compute_trades(
  //     source.sell_orders,
  //     dest.buy_orders,
  //     model.accounting_level |> arbitrage.tax_percent_from_accounting_level,
  //   )
  //   |> list.map(fn(raw_trade) {
  //     let assert Ok(#(name, volume)) = list.key_find(sde.items, raw_trade.item)
  //     let assert Ok(trade) =
  //       arbitrage.raw_trade_to_trade(
  //         raw_trade,
  //         esi.Type(type_id: raw_trade.item, volume: volume, name: name),
  //       )
  //     trade
  //   })

  // let multibuys = {
  //   arbitrage.trades_to_multibuys(
  //     trades,
  //     collateral,
  //     selected_ship.ship.holds |> dict.values,
  //   )
  //   |> list.map(mvu.Multibuy)
  // }

  let effect =
    compute_multibuys.get_compute_multibuys_side_effect(
      source,
      dest,
      selected_ship,
      collateral,
      model.accounting_level,
    )

  #(model, effect)
}

pub fn app_finished_computing_multibuys(
  model: mvu.Model,
  multibuys: List(arbitrage.Multibuy),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, multibuys: Some(multibuys))

  #(model, effect.none())
}
// pub fn esi_returned_type_metadata(
//   model: mvu.Model,
//   esi_response: Result(esi.Type, rsvp.Error),
// ) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
//   case esi_response {
//     Error(e) -> {
//       io.println_error(e |> string.inspect)
//       #(model, effect.none())
//     }
//     Ok(type_metadata) -> {
//       let new_trades =
//         model.trades
//         |> list.map(fn(trade) {
//           case trade {
//             mvu.RawTrade(raw_trade) -> {
//               case raw_trade.item == type_metadata.type_id {
//                 False -> raw_trade |> mvu.RawTrade
//                 True ->
//                   arbitrage.raw_trade_to_trade(raw_trade, type_metadata)
//                   |> result.map(mvu.Trade)
//                   |> result.unwrap(raw_trade |> mvu.RawTrade)
//               }
//             }
//             any -> any
//           }
//         })
//       let possibly_multibuys = case
//         list.all(new_trades, fn(trade) {
//           case trade {
//             mvu.Trade(_) -> True
//             _ -> False
//           }
//         })
//       {
//         True -> {
//           let assert Some(current_ship) = model.current_ship
//           let assert Some(collateral) = model.collateral
//           let trades =
//             list.map(new_trades, fn(trade) {
//               let assert mvu.Trade(trade) = trade
//               trade
//             })
//           let assert Ok(selected_ship) = dict.get(model.ships, current_ship)
//           arbitrage.trades_to_multibuys(
//             trades,
//             collateral,
//             selected_ship.ship.holds |> dict.values,
//           )
//           |> list.map(mvu.Multibuy)
//         }
//         _ -> new_trades
//       }
//       let model = mvu.Model(..model, trades: possibly_multibuys)
//       #(model, effect.none())
//     }
//   }
// }
