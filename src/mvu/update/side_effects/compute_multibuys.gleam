import arbitrage
import config/esi
import config/sde
import gleam/dict
import gleam/list
import lustre/effect
import mvu

pub fn get_compute_multibuys_side_effect(
  source: mvu.System,
  dest: mvu.System,
  selected_ship: mvu.ShipEntry,
  collateral: Int,
  accounting_level: Int,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(dispatch) {
    let trades =
      arbitrage.compute_trades(
        source.sell_orders,
        dest.buy_orders,
        accounting_level |> arbitrage.tax_percent_from_accounting_level,
      )
      |> list.map(fn(raw_trade) {
        let assert Ok(#(name, volume)) =
          list.key_find(sde.items, raw_trade.item)
        let assert Ok(trade) =
          arbitrage.raw_trade_to_trade(
            raw_trade,
            esi.Type(type_id: raw_trade.item, volume: volume, name: name),
          )
        trade
      })

    let multibuys = {
      arbitrage.trades_to_multibuys(
        trades,
        collateral,
        selected_ship.ship.holds |> dict.values,
      )
    }
    dispatch(mvu.AppFinishedComputingMultibuys(multibuys))
  })
}
