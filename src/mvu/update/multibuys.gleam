import arbitrage
import gleam/bool
import gleam/dict
import gleam/io
import gleam/option.{None, Some}
import lustre/effect
import mvu
import mvu/update/side_effects/clipboard

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

  echo arbitrage.compute_trades(
    source.sell_orders,
    dest.buy_orders,
    model.accounting_level |> arbitrage.tax_percent_from_accounting_level,
  )

  todo as "user clicked compute multibuys"
  #(model, effect.none())
}
