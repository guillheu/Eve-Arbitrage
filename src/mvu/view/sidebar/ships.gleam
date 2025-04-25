import config/sde
import gleam/dict
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{Some}
import gleam/result
import gleam/string
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu
import util/numbers

type ShipStyle {
  ShipStyle(
    container: String,
    header: String,
    name_input: String,
    capacity_text: String,
    arrow_icon: String,
  )
}

const default_ship_style = ShipStyle(
  container: "mb-3 border border-gray-200 rounded-md hover:border-gray-300",
  header: "bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100",
  name_input: "font-medium bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-gray-500 px-0 py-0 w-24",
  capacity_text: "text-sm text-gray-600 mr-2 flex-grow",
  arrow_icon: "h-5 w-5 ml-2",
)

const selected_ship_style = ShipStyle(
  container: "mb-3 border-2 border-selected rounded-md bg-indigo-50",
  header: "bg-indigo-100 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-indigo-200",
  name_input: "font-medium text-selected bg-transparent border-0 border-b border-indigo-300 focus:ring-0 focus:border-selected px-0 py-0 w-24",
  capacity_text: "text-sm text-selected mr-2 flex-grow",
  arrow_icon: "h-5 w-5 ml-2 text-selected",
)

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  let mapping_fn = fn(ship_id, ship_entry) {
    let is_selected = case model.current_ship {
      Some(id) if id == ship_id -> True
      _ -> False
    }
    get_ship(ship_id, ship_entry, is_selected)
  }
  let ships_contents = dict.map_values(model.ships, mapping_fn) |> dict.values
  let contents = [
    html.h3([attribute.class("text-sm font-medium text-gray-700 mb-3")], [
      html.text("Ships"),
    ]),
    ..list.append(ships_contents, [get_add_ship_button()])
  ]
  html.div([attribute.class("p-4")], contents)
}

fn get_ship(
  ship_id: Int,
  ship: mvu.ShipEntry,
  is_selected: Bool,
) -> element.Element(mvu.Msg) {
  let style = case is_selected {
    False -> default_ship_style
    True -> selected_ship_style
  }
  case ship.is_expanded {
    False -> get_collapsed_ship(ship_id, ship.ship, style)
    True -> get_expanded_ship(ship_id, ship.ship, style)
  }
}

fn get_expanded_ship(
  ship_id: Int,
  ship: sde.Ship,
  style: ShipStyle,
) -> element.Element(mvu.Msg) {
  let holds_buttons = [
    get_add_hold_button(ship_id),
    get_delete_ship_button(ship_id),
  ]
  let holds =
    dict.map_values(ship.holds, fn(hold_id, hold) {
      get_ship_hold(hold_id, hold, ship_id)
    })
    |> dict.values
  let total_capacity_string =
    list.fold(ship.holds |> dict.values, 0.0, fn(total, hold) {
      total +. hold.capacity
    })
    |> numbers.float_to_human_string
    <> " m³"

  let holds_content = list.append(holds, holds_buttons)
  let attribute_id = "ship-name-" <> int.to_string(ship_id)
  html.div([attribute.class(style.container)], [
    html.div([attribute.class(style.header)], [
      html.div(
        [
          attribute.class(
            "pl-3 pt-3 pb-3 flex-grow flex items-center text-right",
          ),
          event.on_click(mvu.UserSelectedShip(ship_id)),
        ],
        [
          html.input([
            attribute.class(style.name_input),
            attribute.id(attribute_id),
            attribute.value(ship.name),
            attribute.type_("text"),
            event.on_blur(mvu.UserUpdatedShipName(ship_id)),
          ]),
          html.span([attribute.class(style.capacity_text)], [
            html.text(total_capacity_string),
          ]),
        ],
      ),
      html.div(
        [
          attribute.class("pt-3 pb-3 pr-3 flex-shrink-0"),
          event.on_click(mvu.UserCollapsedShip(ship_id)),
        ],
        [
          // html.span(
          //   [
          //     attribute.class(
          //       "bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded",
          //     ),
          //   ],
          //   [html.text("minerals")],
          // ),
          svg.svg(
            [
              attribute("stroke", "currentColor"),
              attribute("viewBox", "0 0 24 24"),
              attribute("fill", "none"),
              attribute.class(style.arrow_icon <> " rotate-180"),
              attribute("xmlns", "http://www.w3.org/2000/svg"),
            ],
            [
              svg.path([
                attribute("d", "M19 9l-7 7-7-7"),
                attribute("stroke-width", "2"),
                attribute("stroke-linejoin", "round"),
                attribute("stroke-linecap", "round"),
              ]),
            ],
          ),
        ],
      ),
    ]),
    html.div([attribute.class("border-t border-gray-200")], [
      html.div([attribute.class("p-3")], holds_content),
    ]),
  ])
}

fn get_collapsed_ship(
  ship_id: Int,
  ship: sde.Ship,
  style: ShipStyle,
) -> element.Element(mvu.Msg) {
  let total_capacity_string =
    list.fold(ship.holds |> dict.values, 0.0, fn(total, hold) {
      total +. hold.capacity
    })
    |> numbers.float_to_human_string
    <> " m³"

  html.div([attribute.class(style.container)], [
    html.div([attribute.class(style.header)], [
      html.div(
        [
          attribute.class(
            "pl-3 pt-3 pb-3 flex-grow flex items-center text-right",
          ),
          event.on_click(mvu.UserSelectedShip(ship_id)),
        ],
        [
          html.span([attribute.class(style.name_input <> " text-left")], [
            html.text(ship.name),
          ]),
          html.span([attribute.class(style.capacity_text)], [
            html.text(total_capacity_string),
          ]),
          // html.span(
        //   [
        //     attribute.class(
        //       "bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded",
        //     ),
        //   ],
        //   [html.text("mixed")],
        // ),
        ],
      ),
      html.div(
        [
          attribute.class("flex-shrink-0 pt-3 pb-3 pr-3"),
          event.on_click(mvu.UserExpandedShip(ship_id)),
        ],
        [
          svg.svg(
            [
              attribute("stroke", "currentColor"),
              attribute("viewBox", "0 0 24 24"),
              attribute("fill", "none"),
              attribute.class("h-5 w-5 ml-2"),
              attribute("xmlns", "http://www.w3.org/2000/svg"),
            ],
            [
              svg.path([
                attribute("d", "M19 9l-7 7-7-7"),
                attribute("stroke-width", "2"),
                attribute("stroke-linejoin", "round"),
                attribute("stroke-linecap", "round"),
              ]),
            ],
          ),
        ],
      ),
    ]),
  ])
}

fn get_ship_hold(
  hold_id: Int,
  hold: sde.Hold,
  ship_id: Int,
) -> element.Element(mvu.Msg) {
  let name_element_id = "hold-name-" <> int.to_string(hold_id)
  let capacity_element_id = "hold-capacity-" <> int.to_string(hold_id)
  let hold_kinds =
    sde.get_all_hold_kinds()
    |> list.map(fn(hold_kind) {
      let hold_kind_string = sde.hold_kind_to_string(hold_kind)
      let hold_kind_id = string.lowercase(hold_kind_string)
      case hold.kind {
        k if k == hold_kind ->
          html.option(
            [attribute.value(hold_kind_id), attribute.selected(True)],
            hold_kind_string,
          )
        _ -> html.option([attribute.value(hold_kind_id)], hold_kind_string)
      }
    })
  html.div([attribute.class("mb-3 p-3 bg-white rounded-md shadow-sm")], [
    html.div([attribute.class("flex justify-between items-center mb-2")], [
      html.input([
        attribute.class(
          "border border-gray-300 rounded-md px-2 py-1 text-sm w-1/2",
        ),
        attribute.id(name_element_id),
        attribute.value(hold.name),
        attribute.type_("text"),
        event.on_blur(mvu.UserUpdatedShipHoldName(hold_id, ship_id)),
      ]),
      html.div([attribute.class("flex items-center")], [
        html.input([
          attribute.class(
            "border border-gray-300 rounded-md px-2 py-1 text-sm w-20 mr-2",
          ),
          attribute.value(hold.capacity |> float.to_string),
          attribute.id(capacity_element_id),
          attribute.type_("number"),
          event.on_blur(mvu.UserUpdatedShipHoldCapacity(hold_id, ship_id)),
        ]),
        html.span([attribute.class("text-xs text-gray-500")], [html.text("m³")]),
      ]),
    ]),
    html.div([attribute.class("flex items-center mt-2")], [
      html.select(
        [
          attribute.class(
            "border border-gray-300 rounded-md px-2 py-1 text-sm flex-grow",
          ),
          event.on_input(mvu.UserUpdatedShipHoldKind(_, hold_id, ship_id)),
        ],
        hold_kinds,
      ),
      html.button(
        [
          attribute("title", "Delete Hold"),
          attribute.class("ml-2 p-1 text-red-500 hover:bg-red-50 rounded-md"),
          event.on_click(mvu.UserDeletedHoldFromShip(hold_id, ship_id)),
        ],
        [
          svg.svg(
            [
              attribute("stroke", "currentColor"),
              attribute("viewBox", "0 0 24 24"),
              attribute("fill", "none"),
              attribute.class("h-4 w-4"),
              attribute("xmlns", "http://www.w3.org/2000/svg"),
            ],
            [
              svg.path([
                attribute(
                  "d",
                  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
                ),
                attribute("stroke-width", "2"),
                attribute("stroke-linejoin", "round"),
                attribute("stroke-linecap", "round"),
              ]),
            ],
          ),
        ],
      ),
    ]),
  ])
}

fn get_add_hold_button(ship_id: Int) -> element.Element(mvu.Msg) {
  html.button(
    [
      attribute.class(
        "flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 mb-3",
      ),
      event.on_click(mvu.UserAddedHoldToShip(ship_id)),
    ],
    [
      svg.svg(
        [
          attribute("stroke", "currentColor"),
          attribute("viewBox", "0 0 24 24"),
          attribute("fill", "none"),
          attribute.class("h-4 w-4 mr-1"),
          attribute("xmlns", "http://www.w3.org/2000/svg"),
        ],
        [
          svg.path([
            attribute("d", "M12 4v16m8-8H4"),
            attribute("stroke-width", "2"),
            attribute("stroke-linejoin", "round"),
            attribute("stroke-linecap", "round"),
          ]),
        ],
      ),
      html.text(
        "Add Hold
                            ",
      ),
    ],
  )
}

fn get_delete_ship_button(ship_id: Int) -> element.Element(mvu.Msg) {
  html.button(
    [
      attribute.class(
        "flex items-center justify-center w-full py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 hover:border-red-300 transition-colors",
      ),
      event.on_click(mvu.UserDeletedShip(ship_id)),
    ],
    [
      svg.svg(
        [
          attribute("stroke", "currentColor"),
          attribute("viewBox", "0 0 24 24"),
          attribute("fill", "none"),
          attribute.class("h-4 w-4 mr-1"),
          attribute("xmlns", "http://www.w3.org/2000/svg"),
        ],
        [
          svg.path([
            attribute(
              "d",
              "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
            ),
            attribute("stroke-width", "2"),
            attribute("stroke-linejoin", "round"),
            attribute("stroke-linecap", "round"),
          ]),
        ],
      ),
      html.text(
        "Delete Ship
                            ",
      ),
    ],
  )
}

fn get_add_ship_button() -> element.Element(mvu.Msg) {
  html.button(
    [
      attribute.class(
        "flex items-center justify-center w-full py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50",
      ),
      event.on_click(mvu.UserCreatedShip),
    ],
    [
      svg.svg(
        [
          attribute("stroke", "currentColor"),
          attribute("viewBox", "0 0 24 24"),
          attribute("fill", "none"),
          attribute.class("h-5 w-5 mr-1"),
          attribute("xmlns", "http://www.w3.org/2000/svg"),
        ],
        [
          svg.path([
            attribute("d", "M12 4v16m8-8H4"),
            attribute("stroke-width", "2"),
            attribute("stroke-linejoin", "round"),
            attribute("stroke-linecap", "round"),
          ]),
        ],
      ),
      html.text(
        "Add Ship
                ",
      ),
    ],
  )
}
