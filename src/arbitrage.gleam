import config/sde
import gleam/float
import gleam/int
import gleam/list
import gleam/string

const base_tax_rate = 7.5

const tax_reduction_per_accounting_level = 11.0

pub type Item {
  Item(id: sde.Id, name: String, m3: Float)
}

pub type Trade {
  Trade(
    source: sde.Location,
    destination: sde.Location,
    item: Item,
    amount: Int,
    unit_buy_price: Int,
    unit_sell_price: Int,
  )
}

pub type Order

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
