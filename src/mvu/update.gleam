import config/esi
import config/sde
import gleam/dict
import gleam/http/response
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{Some}
import gleam/string
import lustre/effect
import mvu
import mvu/update/systems
import rsvp

pub fn run(
  model: mvu.Model,
  msg: mvu.Msg,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case msg {
    mvu.UserSelectedDestination(new_destination) ->
      systems.user_selected_destination(new_destination, model)
    mvu.UserSelectedSource(new_source) ->
      systems.user_selected_source(new_source, model)
    mvu.UserSelectedShip(selected_ship) ->
      systems.user_selected_ship(selected_ship, model)
    mvu.EsiReturnedBuyOrders(esi_response, location, page) ->
      systems.esi_returned_buy_orders(model, esi_response, location, page)
    mvu.EsiReturnedSellOrders(esi_response, location, page) ->
      systems.esi_returned_sell_orders(model, esi_response, location, page)
    mvu.UserLoadedDestination(destination) ->
      systems.user_loaded_destination(model, destination)
    mvu.UserLoadedSource(source) -> systems.user_loaded_source(model, source)
  }
}
