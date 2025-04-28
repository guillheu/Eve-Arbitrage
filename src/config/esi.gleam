import config/sde
import gleam/bool
import gleam/dynamic/decode
import gleam/int
import gleam/string

const esi_url = "https://esi.evetech.net/latest"

const market_order_url = "/markets/{region_id}/orders/?datasource=tranquility&order_type={order_kind}&page={page}"

pub type Sell

pub type Buy

pub type Order(kind) {
  Order(
    duration: Int,
    issued: String,
    location_id: sde.Id,
    min_volume: Int,
    order_id: sde.Id,
    price: Float,
    range: String,
    system_id: sde.Id,
    type_id: sde.Id,
    volume_remain: Int,
    volume_total: Int,
  )
}

pub fn get_market_orders_url(
  from: sde.Location,
  is_buy_order: Bool,
  page: Int,
) -> String {
  let order_kind = case is_buy_order {
    False -> "sell"
    True -> "buy"
  }
  [esi_url, market_order_url]
  |> string.concat
  |> string.replace("{region_id}", int.to_string(from.region))
  |> string.replace("{order_kind}", order_kind)
  |> string.replace("{page}", page |> int.to_string)
}

pub fn buy_orders_decoder() -> decode.Decoder(List(Order(Buy))) {
  decode.list(buy_order_decoder())
}

pub fn sell_orders_decoder() -> decode.Decoder(List(Order(Sell))) {
  decode.list(sell_order_decoder())
}

pub fn merge_orders(
  order_1: Order(any),
  order_2: Order(any),
) -> Result(Order(any), Nil) {
  let can_merge =
    order_1.location_id == order_2.location_id
    && order_1.price == order_2.price
    && order_1.type_id == order_2.type_id
    && order_1.system_id == order_2.system_id
  case can_merge {
    False -> Error(Nil)
    True -> {
      echo "FROM:"
      echo order_1
      echo order_2
      echo "TO"
      Ok(
        echo Order(
          ..order_1,
          volume_remain: order_1.volume_remain + order_2.volume_remain,
          volume_total: order_1.volume_total + order_2.volume_total,
        ),
      )
    }
  }
}

fn buy_order_decoder() -> decode.Decoder(Order(Buy)) {
  use duration <- decode.field("duration", decode.int)
  use is_buy_order <- decode.field("is_buy_order", decode.bool)
  use <- bool.lazy_guard(!is_buy_order, fn() {
    panic as "found a sell order, should be a buy order"
  })
  use issued <- decode.field("issued", decode.string)
  use location_id <- decode.field("location_id", decode.int)
  use min_volume <- decode.field("min_volume", decode.int)
  use order_id <- decode.field("order_id", decode.int)
  use price <- decode.field("price", decode.float)
  use range <- decode.field("range", decode.string)
  use system_id <- decode.field("system_id", decode.int)
  use type_id <- decode.field("type_id", decode.int)
  use volume_remain <- decode.field("volume_remain", decode.int)
  use volume_total <- decode.field("volume_total", decode.int)
  decode.success(Order(
    duration:,
    issued:,
    location_id:,
    min_volume:,
    order_id:,
    price:,
    range:,
    system_id:,
    type_id:,
    volume_remain:,
    volume_total:,
  ))
}

fn sell_order_decoder() -> decode.Decoder(Order(Sell)) {
  use duration <- decode.field("duration", decode.int)
  use is_buy_order <- decode.field("is_buy_order", decode.bool)
  use <- bool.lazy_guard(is_buy_order, fn() {
    panic as "found a buy order, should be a sell order"
  })
  use issued <- decode.field("issued", decode.string)
  use location_id <- decode.field("location_id", decode.int)
  use min_volume <- decode.field("min_volume", decode.int)
  use order_id <- decode.field("order_id", decode.int)
  use price <- decode.field("price", decode.float)
  use range <- decode.field("range", decode.string)
  use system_id <- decode.field("system_id", decode.int)
  use type_id <- decode.field("type_id", decode.int)
  use volume_remain <- decode.field("volume_remain", decode.int)
  use volume_total <- decode.field("volume_total", decode.int)
  decode.success(Order(
    duration:,
    issued:,
    location_id:,
    min_volume:,
    order_id:,
    price:,
    range:,
    system_id:,
    type_id:,
    volume_remain:,
    volume_total:,
  ))
}
