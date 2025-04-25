import arbitrage
import config/esi
import config/sde
import gleam/dict.{type Dict}
import gleam/float
import gleam/int
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/time/timestamp
import rsvp

pub type Model {
  Model(
    ships: Dict(Int, ShipEntry),
    current_ship: Option(Int),
    count_ship_index: Int,
    count_cargo_index: Int,
    systems: Dict(String, System),
    source: Option(String),
    destination: Option(String),
    accounting_level: Int,
    language: String,
    sidebar_expanded: Bool,
    collateral: Option(Int),
    multibuys: List(arbitrage.Multibuy),
  )
}

pub type ShipEntry {
  ShipEntry(ship: sde.Ship, is_expanded: Bool)
}

pub type OrdersStatus {
  Empty
  Loading
  Loaded(timestamp.Timestamp)
}

pub type System {
  System(
    location: sde.Location,
    buy_orders: List(esi.Order(esi.Buy)),
    buy_orders_status: OrdersStatus,
    sell_orders: List(esi.Order(esi.Sell)),
    sell_orders_status: OrdersStatus,
  )
}

pub type Msg {

  // systems messages
  UserSelectedSource(new_source: String)
  UserSelectedDestination(new_destination: String)

  // orders messages
  UserLoadedSource(source: String)
  UserLoadedDestination(destination: String)
  EsiReturnedBuyOrders(
    Result(List(esi.Order(esi.Buy)), rsvp.Error),
    location: String,
    page: Int,
  )
  EsiReturnedSellOrders(
    Result(List(esi.Order(esi.Sell)), rsvp.Error),
    location: String,
    page: Int,
  )

  // multibuy messages
  UserClickedCopyMultibuy(multibuy: arbitrage.Multibuy)

  // sidebar messages
  UserClickedExpandSidebar
  UserClickedCollapseSidebar
  UserUpdatedCollateral(value: Option(Int))
  UserUpdatedAccountingLevel(level: Int)

  // ship messages
  UserCreatedShip
  UserDeletedShip(deleted_ship: Int)
  UserSelectedShip(selected_ship: Int)
  UserUpdatedShipName(id: Int)
  UserUpdatedShipHoldName(hold_id: Int, ship_id: Int)
  UserUpdatedShipHoldCapacity(hold_id: Int, ship_id: Int)
}

pub fn float_input_to_msg(input: String, msg: fn(Option(Float)) -> Msg) {
  let value =
    float.parse(input)
    |> result.lazy_or(fn() {
      use value <- result.map(int.parse(input))
      int.to_float(value)
    })
    |> option.from_result
  msg(value)
}

pub fn int_input_to_msg(input: String, msg: fn(Option(Int)) -> Msg) {
  let value =
    int.parse(input)
    |> option.from_result
  msg(value)
}

pub fn string_input_to_msg(input: String, msg: fn(Option(String)) -> Msg) {
  case input {
    "" -> None
    any -> Some(any)
  }
  |> msg
}
