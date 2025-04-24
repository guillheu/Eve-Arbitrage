import arbitrage
import config/esi
import config/sde
import gleam/dict.{type Dict}
import gleam/option.{type Option}
import gleam/time/timestamp
import rsvp

pub type Model {
  Model(
    ships: Dict(String, sde.Ship),
    current_ship: Option(String),
    systems: Dict(String, System),
    source: Option(String),
    destination: Option(String),
    accounting_level: Int,
    language: String,
    sidebar_expanded: Bool,
    collateral: Option(Float),
    multibuys: List(arbitrage.Multibuy),
  )
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
  UserSelectedSource(new_source: String)
  UserSelectedDestination(new_destination: String)
  UserLoadedSource(source: String)
  UserLoadedDestination(destination: String)
  UserSelectedShip(selected_ship: String)
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
  UserClickedCopyMultibuy(multibuy: arbitrage.Multibuy)
  UserClickedExpandSidebar
  UserClickedCollapseSidebar
  UserUpdatedCollateral(value: Option(Float))
  UserUpdatedAccountingLevel(level: Int)
}
