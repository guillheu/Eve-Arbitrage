import config/esi
import config/sde
import gleam/bool
import gleam/dict.{type Dict}
import gleam/float
import gleam/int
import gleam/list
import gleam/order
import gleam/string

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
    unit_volume: Float,
    total_volume: Float,
    unit_buy_price: Float,
    unit_sell_price: Float,
    total_price: Float,
    price_per_volume: Float,
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
  Multibuy(purchases: List(Purchase), total_price: Float)
}

pub opaque type Purchase {
  Purchase(
    item_name: String,
    amount: Int,
    unit_price: Float,
    total_price: Float,
  )
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
  |> list.filter(fn(raw_trade) { echo raw_trade.unit_profit >. 0.0 })
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
  Multibuy(
    purchases: purchases,
    total_price: list.fold(purchases, 0.0, fn(total, purchase) {
      total +. purchase.total_price
    }),
  )
}

pub fn new_purchase(name: String, amount: Int, unit_price: Float) -> Purchase {
  Purchase(name, amount, unit_price, unit_price *. { amount |> int.to_float })
}

pub fn get_multibuy_purchases(multibuy: Multibuy) -> List(Purchase) {
  multibuy.purchases
}

pub fn get_multibuy_total_price(multibuy: Multibuy) -> Float {
  multibuy.total_price
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
