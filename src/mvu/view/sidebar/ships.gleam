import config/sde
import gleam/dict
import gleam/float
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu
import util/element as dom_element

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  let ships_contents = dict.map_values(model.ships, get_ship) |> dict.values
  let contents = [
    html.h3([attribute.class("text-sm font-medium text-gray-700 mb-3")], [
      html.text("Ships"),
    ]),
    ..list.append(ships_contents, [get_add_ship_button()])
  ]
  html.div([attribute.class("p-4")], contents)
}

fn get_ship(ship_id: Int, ship: mvu.ShipEntry) -> element.Element(mvu.Msg) {
  case ship.is_expanded {
    False -> get_collapsed_ship(ship.ship)
    True -> get_expanded_ship(ship_id, ship.ship)
  }
}

fn get_expanded_ship(ship_id: Int, ship: sde.Ship) -> element.Element(mvu.Msg) {
  let holds_buttons = [get_add_hold_button(), get_delete_ship_button()]
  let holds = list.map(ship.holds, get_ship_hold)
  let holds_content = list.append(holds, holds_buttons)
  let attribute_id = "ship-name-" <> int.to_string(ship_id)
  html.div(
    [
      attribute.class(
        "mb-3 border border-gray-200 rounded-md hover:border-gray-300",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-3 bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100",
          ),
        ],
        [
          html.input([
            attribute.class(
              "font-medium bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-gray-500 px-0 py-0 w-24",
            ),
            attribute.id(attribute_id),
            attribute.value(ship.name),
            attribute.type_("text"),
            event.on_blur(mvu.UserUpdatedShipName(ship_id)),
          ]),
          html.div([attribute.class("flex items-center")], [
            html.span([attribute.class("text-sm text-gray-600 mr-2")], [
              html.text("7,500 m³"),
            ]),
            html.span(
              [
                attribute.class(
                  "bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded",
                ),
              ],
              [html.text("minerals")],
            ),
            svg.svg(
              [
                attribute("stroke", "currentColor"),
                attribute("viewBox", "0 0 24 24"),
                attribute("fill", "none"),
                attribute.class("h-5 w-5 ml-2 rotate-180"),
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
          ]),
        ],
      ),
      html.div(
        [
          attribute.class(
            "collapsible-content demo-expanded border-t border-gray-200",
          ),
        ],
        [html.div([attribute.class("p-3")], holds_content)],
      ),
    ],
  )
}

// fn get_on_blur_event(
//   element_id: String,
//   default_value: String,
//   msg: fn(String) -> mvu.Msg,
// ) -> attribute.Attribute(mvu.Msg) {
//   let trigger = fn() {
//     let element_result = dom_element.get_element_by_id(element_id)
//     let value_result =
//       result.try(element_result, fn(element) { dom_element.value(element) })
//     let value = result.unwrap(value_result, default_value)
//     msg(value)
//   }

//   event.on_blur(trigger())
// }

fn get_collapsed_ship(ship: sde.Ship) -> element.Element(mvu.Msg) {
  html.div(
    [
      attribute.class(
        "mb-3 border border-gray-200 rounded-md hover:border-gray-300",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-3 bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100",
          ),
        ],
        [
          html.span([attribute.class("font-medium")], [
            html.text("Iteron Mark V"),
          ]),
          html.div([attribute.class("flex items-center")], [
            html.span([attribute.class("text-sm text-gray-600 mr-2")], [
              html.text("27,500 m³"),
            ]),
            html.span(
              [
                attribute.class(
                  "bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded",
                ),
              ],
              [html.text("mixed")],
            ),
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
          ]),
        ],
      ),
    ],
  )
}

fn get_ship_hold(hold: sde.Hold) -> element.Element(mvu.Msg) {
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
        attribute.value(hold.name),
        attribute.type_("text"),
      ]),
      html.div([attribute.class("flex items-center")], [
        html.input([
          attribute.class(
            "border border-gray-300 rounded-md px-2 py-1 text-sm w-20 mr-2",
          ),
          attribute.value(hold.m3 |> float.to_string),
          attribute.type_("number"),
        ]),
        html.span([attribute.class("text-xs text-gray-500")], [html.text("m³")]),
      ]),
    ]),
    html.div([], [
      html.select(
        [
          attribute.class(
            "border border-gray-300 rounded-md px-2 py-1 text-sm w-full",
          ),
        ],
        hold_kinds,
      ),
    ]),
  ])
}

fn get_add_hold_button() -> element.Element(mvu.Msg) {
  html.button(
    [
      attribute.class(
        "flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 mb-3",
      ),
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

fn get_delete_ship_button() -> element.Element(mvu.Msg) {
  html.button(
    [
      attribute.class(
        "flex items-center justify-center w-full py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 hover:border-red-300 transition-colors",
      ),
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
