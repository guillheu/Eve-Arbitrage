import config/sde

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
