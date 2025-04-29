import config/esi
import config/sde
import gleam/bool
import gleam/dict.{type Dict}
import gleam/float
import gleam/int
import gleam/io
import gleam/list
import gleam/option
import gleam/order
import gleam/string
import util/numbers

const base_tax_rate = 7.5

const tax_reduction_per_accounting_level = 11.0

pub type Item {
  Item(id: sde.Id, name: String, m3: Float)
}

pub type Trade {
  Trade(
    source: Int,
    destination: Int,
    item: Item,
    amount: Int,
    total_volume: Float,
    unit_buy_price: Float,
    unit_sell_price: Float,
    total_price: Float,
    profit_per_volume: Float,
  )
}

pub type RawTrade {
  RawTrade(
    source: Int,
    destination: Int,
    item: Int,
    amount: Int,
    unit_buy_price: Float,
    unit_sell_price: Float,
    unit_profit: Float,
  )
}

pub opaque type Multibuy {
  Multibuy(purchases: List(Purchase), total_price: Float, total_profit: Float)
}

pub opaque type Purchase {
  Purchase(
    item_name: String,
    amount: Int,
    unit_price: Float,
    total_price: Float,
    total_profit: Float,
  )
}

// Optimizations :
// Prioritize holds with shorter allow lists
// Split trades in separate holds

pub fn trades_to_multibuys(
  trades: List(Trade),
  collateral: Int,
  holds: List(sde.Hold),
) -> List(Multibuy) {
  let sorted_trades =
    list.sort(trades, fn(trade_1, trade_2) {
      float.compare(trade_2.profit_per_volume, trade_1.profit_per_volume)
    })

  let collateral =
    { collateral * 1_000_000 }
    |> int.to_float

  let #(selected_trades, _leftover_trades, _leftover_collateral) =
    list.fold(holds, #([], sorted_trades, collateral), fn(input, hold) {
      let #(old_selected_trades, leftover_trades, remaining_collateral) = input
      let #(new_selected_trades, leftover_trades, remaining_collateral) =
        pick_trades_for_hold(hold, remaining_collateral, leftover_trades)
      let current_selected_trades =
        list.append(new_selected_trades, old_selected_trades)
      #(current_selected_trades, leftover_trades, remaining_collateral)
    })

  selected_trades_to_multibuys(selected_trades)
}

fn pick_trades_for_hold(
  hold: sde.Hold,
  collateral: Float,
  trades: List(Trade),
) -> #(List(Trade), List(Trade), Float) {
  let capacity = hold.capacity
  let #(
    selected_trades,
    leftover_trades,
    remaining_collateral,
    _remaining_capacity,
  ) = {
    use
      #(
        selected_trades,
        leftover_trades,
        remaining_collateral,
        remaining_capacity,
      ),
      current_trade
    <- list.fold(trades, #([], [], collateral, capacity))
    case
      current_trade.total_volume <=. remaining_capacity,
      current_trade.total_price <=. remaining_collateral,
      sde.is_item_allowed_in_hold(current_trade.item.id, hold.kind)
    {
      _, _, False -> #(
        selected_trades,
        [current_trade, ..leftover_trades],
        remaining_collateral,
        remaining_capacity,
      )
      True, True, True -> #(
        [current_trade, ..selected_trades],
        leftover_trades,
        remaining_collateral -. current_trade.total_price,
        remaining_capacity -. current_trade.total_volume,
      )
      _, _, _ -> {
        case
          split_trade_to_fit(
            current_trade,
            remaining_collateral,
            remaining_capacity,
          )
        {
          Error(_) -> #(
            selected_trades,
            [current_trade, ..leftover_trades],
            remaining_collateral,
            remaining_capacity,
          )
          Ok(#(fitted_trade, leftover_trade)) -> #(
            [fitted_trade, ..selected_trades],
            [leftover_trade, ..leftover_trades],
            remaining_collateral -. fitted_trade.total_price,
            remaining_capacity -. fitted_trade.total_volume,
          )
        }
      }
    }
  }
  #(selected_trades, leftover_trades, remaining_collateral)
}

fn split_trade_to_fit(
  trade: Trade,
  collateral: Float,
  capacity: Float,
) -> Result(#(Trade, Trade), Nil) {
  let unit_volume = trade.total_volume /. int.to_float(trade.amount)
  let collateral_fits =
    { collateral /. trade.unit_sell_price } |> float.truncate
  let capacity_fits = { capacity /. unit_volume } |> float.truncate
  let can_fit = int.min(collateral_fits, capacity_fits)
  let remaining_amount = trade.amount - can_fit
  case int.compare(can_fit, 0) {
    order.Eq -> Error(Nil)
    order.Gt ->
      Ok(#(
        Trade(
          ..trade,
          amount: can_fit,
          total_volume: unit_volume *. int.to_float(can_fit),
          total_price: trade.unit_sell_price *. int.to_float(can_fit),
        ),
        Trade(
          ..trade,
          amount: remaining_amount,
          total_volume: unit_volume *. int.to_float(remaining_amount),
          total_price: trade.unit_sell_price *. int.to_float(remaining_amount),
        ),
      ))
    order.Lt -> panic as "negative capacity ? negative collateral ?"
  }
}

fn trade_to_purchase(trade: Trade) -> Purchase {
  Purchase(
    item_name: trade.item.name,
    amount: trade.amount,
    unit_price: trade.unit_sell_price,
    total_price: trade.unit_sell_price *. { trade.amount |> int.to_float },
    total_profit: { trade.unit_buy_price -. trade.unit_sell_price }
      *. { trade.amount |> int.to_float },
  )
}

fn selected_trades_to_multibuys(from: List(Trade)) -> List(Multibuy) {
  {
    use split_trades, current_trade <- list.fold(from, dict.new())
    dict.upsert(
      split_trades,
      current_trade.item,
      fn(optional_found_trades: option.Option(List(Trade))) {
        option.unwrap(optional_found_trades, [])
        |> list.prepend(current_trade)
      },
    )
  }
  |> dict.values
  // sorting from longest to shortest list.
  // The longest (first) list will become the list of multibuys
  |> list.sort(fn(trades_1, trades_2) {
    int.compare(trades_2 |> list.length, trades_1 |> list.length)
  })
  |> list.transpose
  |> list.map(fn(list_of_trades) {
    list_of_trades
    |> list.map(trade_to_purchase)
  })
  |> list.map(multibuy_from_purchases)
}

pub fn raw_trade_to_trade(
  raw_trade: RawTrade,
  type_: esi.Type,
) -> Result(Trade, Nil) {
  case raw_trade.item == type_.type_id {
    False -> Error(Nil)
    True ->
      Trade(
        source: raw_trade.source,
        destination: raw_trade.destination,
        item: Item(id: type_.type_id, name: type_.name, m3: type_.volume),
        amount: raw_trade.amount,
        total_volume: { raw_trade.amount |> int.to_float } *. type_.volume,
        unit_buy_price: raw_trade.unit_buy_price,
        unit_sell_price: raw_trade.unit_sell_price,
        profit_per_volume: raw_trade.unit_profit /. type_.volume,
        total_price: raw_trade.unit_sell_price
          *. { raw_trade.amount |> int.to_float },
      )
      |> Ok
  }
}

// 1: merge similar buy & sell orders
// if they have the same price & location

fn merge_orders(orders: List(esi.Order(any))) -> Dict(Int, List(esi.Order(any))) {
  let r = {
    use acc, order <- list.fold(orders, dict.new())
    let current_item_orders_list = case dict.get(acc, order.type_id) {
      Error(_) -> [order]
      Ok(list) -> [order, ..list]
    }
    dict.insert(acc, order.type_id, current_item_orders_list)
  }
  dict.map_values(r, fn(_, orders) {
    let ordered_orders =
      list.sort(orders, fn(order_1, order_2) {
        float.compare(order_1.price, order_2.price)
      })
    list.fold(ordered_orders, [], fn(new_orders: List(esi.Order(any)), order) {
      use <- bool.guard(list.is_empty(new_orders), [order])
      let assert [top, ..rest] = new_orders
      case esi.merge_orders(top, order) {
        Error(_) -> [order, top, ..rest]
        Ok(merged_order) -> [merged_order, ..rest]
      }
    })
  })
}

pub fn compute_trades(
  sell_orders: List(esi.Order(esi.Sell)),
  buy_orders: List(esi.Order(esi.Buy)),
  tax_rate: Float,
) -> List(RawTrade) {
  let sell_orders = merge_orders(sell_orders)
  let buy_orders = merge_orders(buy_orders)
  let sell_orders_items = dict.keys(sell_orders)
  let buy_orders_items = dict.keys(buy_orders)
  let tradeable_items =
    list.filter(sell_orders_items, list.contains(buy_orders_items, _))
  {
    use item <- list.map(tradeable_items)
    let assert Ok(item_sell_orders) = dict.get(sell_orders, item)
    let assert Ok(item_buy_orders) = dict.get(buy_orders, item)
    let sorted_item_sell_orders =
      list.sort(item_sell_orders, fn(order_1, order_2) {
        float.compare(order_1.price, order_2.price)
      })
    let sorted_item_buy_orders =
      list.sort(item_buy_orders, fn(order_1, order_2) {
        float.compare(order_2.price, order_1.price)
      })
    recurse_compute_trades_from_item_orders(
      sorted_item_sell_orders,
      sorted_item_buy_orders,
      [],
    )
  }
  |> list.flatten
  |> list.map(fn(raw_trade) {
    let buy_price_with_taxes = raw_trade.unit_buy_price *. tax_rate
    RawTrade(
      ..raw_trade,
      unit_buy_price: buy_price_with_taxes,
      unit_profit: buy_price_with_taxes -. raw_trade.unit_sell_price,
    )
  })
  |> list.filter(fn(raw_trade) { raw_trade.unit_profit >. 0.0 })
}

fn recurse_compute_trades_from_item_orders(
  sell_orders: List(esi.Order(esi.Sell)),
  buy_orders: List(esi.Order(esi.Buy)),
  acc: List(RawTrade),
) -> List(RawTrade) {
  use <- bool.guard(
    list.is_empty(sell_orders) || list.is_empty(buy_orders),
    acc,
  )
  let assert [top_sell_order, ..rest_sell_orders] = sell_orders
  let assert [top_buy_order, ..rest_buy_orders] = buy_orders
  case int.compare(top_sell_order.volume_remain, top_buy_order.volume_remain) {
    order.Eq -> {
      let trade =
        RawTrade(
          source: top_sell_order.location_id,
          destination: top_buy_order.location_id,
          item: top_sell_order.type_id,
          amount: top_sell_order.volume_remain,
          unit_buy_price: top_buy_order.price,
          unit_sell_price: top_sell_order.price,
          unit_profit: top_buy_order.price -. top_sell_order.price,
        )
      recurse_compute_trades_from_item_orders(
        rest_sell_orders,
        rest_buy_orders,
        [trade, ..acc],
      )
    }
    order.Gt -> {
      let trade =
        RawTrade(
          source: top_sell_order.location_id,
          destination: top_buy_order.location_id,
          item: top_sell_order.type_id,
          amount: top_buy_order.volume_remain,
          unit_buy_price: top_buy_order.price,
          unit_sell_price: top_sell_order.price,
          unit_profit: top_buy_order.price -. top_sell_order.price,
        )
      let remaining_top_sell_order =
        esi.drain_order(top_sell_order, top_buy_order.volume_remain)
      recurse_compute_trades_from_item_orders(
        [remaining_top_sell_order, ..rest_sell_orders],
        rest_buy_orders,
        [trade, ..acc],
      )
    }
    order.Lt -> {
      let trade =
        RawTrade(
          source: top_sell_order.location_id,
          destination: top_buy_order.location_id,
          item: top_sell_order.type_id,
          amount: top_sell_order.volume_remain,
          unit_buy_price: top_buy_order.price,
          unit_sell_price: top_sell_order.price,
          unit_profit: top_buy_order.price -. top_sell_order.price,
        )
      let remaining_top_buy_order =
        esi.drain_order(top_buy_order, top_sell_order.volume_remain)
      recurse_compute_trades_from_item_orders(
        rest_sell_orders,
        [remaining_top_buy_order, ..rest_buy_orders],
        [trade, ..acc],
      )
    }
  }
}

pub fn multibuy_from_purchases(purchases: List(Purchase)) -> Multibuy {
  let #(total_price, total_profit) =
    list.fold(purchases, #(0.0, 0.0), fn(input, purchase) {
      let #(price, profit) = input
      #(price +. purchase.total_price, profit +. purchase.total_profit)
    })
  Multibuy(
    purchases: purchases,
    total_price: total_price,
    total_profit: total_profit,
  )
}

pub fn new_purchase(
  name: String,
  amount: Int,
  unit_price: Float,
  unit_profit: Float,
) -> Purchase {
  let amount_float = amount |> int.to_float
  Purchase(
    name,
    amount,
    unit_price,
    unit_price *. amount_float,
    total_profit: amount_float *. unit_profit,
  )
}

pub fn get_multibuy_purchases(multibuy: Multibuy) -> List(Purchase) {
  multibuy.purchases
}

pub fn get_multibuy_total_price(multibuy: Multibuy) -> Float {
  multibuy.total_price
}

pub fn get_multibuy_total_profit(multibuy: Multibuy) -> Float {
  multibuy.total_profit
}

pub fn purchase_to_string(purchase: Purchase) -> String {
  purchase.item_name
  <> "\t"
  <> int.to_string(purchase.amount)
  <> "\t"
  <> float.to_string(purchase.unit_price)
  <> "\t"
  <> float.to_string(purchase.total_price)
}

pub fn multibuy_to_string(multibuy: Multibuy) -> String {
  list.map(multibuy.purchases, fn(purchase) {
    purchase_to_string(purchase) <> "\n"
  })
  |> string.concat
  |> string.drop_end(1)
}

pub fn tax_percent_from_accounting_level(accounting_level: Int) -> Float {
  // 55.0 at level 5 accounting, 11% per level
  let accounting_tax_percent_reduction = {
    { accounting_level |> int.to_float } *. tax_reduction_per_accounting_level
  }
  // 0.45 at level 5 accounting
  let remaining_tax_ratio = 1.0 -. { accounting_tax_percent_reduction /. 100.0 }
  // 0.45 * 7.5% = 3.375%
  let effective_tax_rate = base_tax_rate *. remaining_tax_ratio
  effective_tax_rate
}
