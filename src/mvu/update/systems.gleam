import config/esi
import gleam/dict
import gleam/http/response
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import gleam/time/timestamp
import lustre/effect
import mvu
import mvu/update/side_effects/fetch_orders
import rsvp

pub fn user_selected_source(
  new_source: String,
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, source: Some(new_source))
  let side_effect = effect.none()
  io.println("Source " <> new_source <> " selected")
  #(model, side_effect)
}

pub fn user_selected_destination(
  new_dest: String,
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, destination: Some(new_dest))
  let side_effect = effect.none()
  io.println("Destination " <> new_dest <> " selected")
  #(model, side_effect)
}

pub fn esi_returned_sell_orders(
  model: mvu.Model,
  esi_response: Result(List(esi.Order(esi.Sell)), rsvp.Error),
  from: String,
  page: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case esi_response {
    Error(rsvp.HttpError(response.Response(
      404,
      _headers,
      "{\"error\":\"Requested page does not exist!\"}",
    ))) -> {
      io.println("Reached sell orders last page for location " <> from)
      let assert Ok(system) = dict.get(model.systems, from)
      io.println(
        system.sell_orders |> list.length |> int.to_string
        <> " sell orders found",
      )

      let assert Ok(system) = dict.get(model.systems, from)
      let system =
        mvu.System(
          ..system,
          sell_orders_status: mvu.Loaded(timestamp.system_time()),
        )

      let systems =
        dict.upsert(model.systems, from, fn(found) {
          option.lazy_unwrap(found, fn() {
            panic as { "system " <> from <> " should be present" }
          })
          system
        })
      let model = mvu.Model(..model, systems: systems)
      #(model, effect.none())
    }
    Error(e) -> {
      io.println_error(e |> string.inspect)
      #(model, effect.none())
    }
    Ok(orders) -> {
      let systems =
        dict.upsert(model.systems, from, fn(system_option) {
          let system =
            option.lazy_unwrap(system_option, fn() {
              panic as { "system " <> from <> " should be present" }
            })
          mvu.System(
            ..system,
            sell_orders: system.sell_orders |> list.append(orders),
          )
        })
      let assert Ok(system) = dict.get(model.systems, from)
      io.println(
        "Fetched " <> from <> " sell orders page " <> int.to_string(page),
      )
      #(
        mvu.Model(..model, systems: systems),
        fetch_orders.get_query_sell_orders_side_effect(
          system.location,
          from,
          page + 1,
        ),
      )
    }
  }
}

pub fn esi_returned_buy_orders(
  model: mvu.Model,
  esi_response: Result(List(esi.Order(esi.Buy)), rsvp.Error),
  from: String,
  page: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case esi_response {
    Error(rsvp.HttpError(response.Response(
      404,
      _headers,
      "{\"error\":\"Requested page does not exist!\"}",
    ))) -> {
      io.println("Reached buy orders last page for location " <> from)
      let assert Ok(system) = dict.get(model.systems, from)
      io.println(
        system.buy_orders |> list.length |> int.to_string <> " buy orders found",
      )
      let assert Ok(system) = dict.get(model.systems, from)
      let system =
        mvu.System(
          ..system,
          buy_orders_status: mvu.Loaded(timestamp.system_time()),
        )

      let systems =
        dict.upsert(model.systems, from, fn(found) {
          option.lazy_unwrap(found, fn() {
            panic as { "system " <> from <> " should be present" }
          })
          system
        })
      let model = mvu.Model(..model, systems: systems)
      #(model, effect.none())
    }
    Error(e) -> {
      io.println_error(e |> string.inspect)
      #(model, effect.none())
    }
    Ok(orders) -> {
      let systems =
        dict.upsert(model.systems, from, fn(system_option) {
          let system =
            option.lazy_unwrap(system_option, fn() {
              panic as { "system " <> from <> " should be present" }
            })
          mvu.System(
            ..system,
            buy_orders: system.buy_orders |> list.append(orders),
          )
        })
      let assert Ok(system) = dict.get(model.systems, from)
      io.println(
        "Fetched " <> from <> " buy orders page " <> int.to_string(page),
      )
      #(
        mvu.Model(..model, systems: systems),
        fetch_orders.get_query_buy_orders_side_effect(
          system.location,
          from,
          page + 1,
        ),
      )
    }
  }
}

pub fn user_loaded_source(
  model: mvu.Model,
  from: String,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(system) = dict.get(model.systems, from)
  let side_effect =
    fetch_orders.get_query_sell_orders_side_effect(system.location, from, 1)
  let system =
    mvu.System(..system, sell_orders_status: mvu.Loading, sell_orders: [])
  let systems =
    dict.upsert(model.systems, from, fn(found) {
      option.lazy_unwrap(found, fn() {
        panic as { "did not find system " <> from }
      })
      system
    })
  let model = case model.source {
    Some(current_source) if current_source == from ->
      mvu.Model(..model, source: None)
    _ -> model
  }
  #(mvu.Model(..model, systems: systems), side_effect)
}

pub fn user_loaded_destination(
  model: mvu.Model,
  to: String,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(system) = dict.get(model.systems, to)
  let side_effect =
    fetch_orders.get_query_buy_orders_side_effect(system.location, to, 1)
  let system =
    mvu.System(..system, buy_orders_status: mvu.Loading, buy_orders: [])
  let systems =
    dict.upsert(model.systems, to, fn(found) {
      option.lazy_unwrap(found, fn() {
        panic as { "did not find system " <> to }
      })
      system
    })
  let model = case model.destination {
    Some(current_destination) if current_destination == to ->
      mvu.Model(..model, destination: None)
    _ -> model
  }
  #(mvu.Model(..model, systems: systems), side_effect)
}
