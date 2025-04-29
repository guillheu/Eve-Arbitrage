import arbitrage
import gleam/dict
import gleam/float
import gleam/int
import gleam/list
import gleam/option
import gleam/string
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu
import mvu/view/sidebar/accounting
import mvu/view/sidebar/collateral
import mvu/view/sidebar/ships
import util/numbers

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  case model.sidebar_expanded {
    False -> get_collapsed_sidebar
    True -> get_expanded_sidebar
  }(model)
}

fn get_expanded_sidebar(model: mvu.Model) -> element.Element(mvu.Msg) {
  html.aside(
    [
      attribute.class(
        "fixed z-10 top-0 left-0 w-80 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-4 border-b border-gray-200 flex justify-between items-center",
          ),
        ],
        [
          html.h2([attribute.class("text-lg font-bold")], [
            html.text("Configuration"),
          ]),
          html.button(
            [
              attribute("title", "Toggle Sidebar"),
              attribute.class("p-1 rounded-md hover:bg-gray-100"),
              event.on_click(mvu.UserClickedCollapseSidebar),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute("d", "M11 19l-7-7 7-7m8 14l-7-7 7-7"),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
        ],
      ),
      collateral.get_section(model.collateral),
      accounting.get_section(model.accounting_level),
      ships.get_section(model),
    ],
  )
}

fn get_collapsed_sidebar(model: mvu.Model) -> element.Element(mvu.Msg) {
  let collateral = model.collateral |> option.unwrap(0)
  let collateral_amount_string = numbers.millions_to_unit_string(collateral)
  let accounting_level_string =
    "LvL " <> model.accounting_level |> int.to_string
  let tax_rate_string =
    arbitrage.tax_percent_from_accounting_level(model.accounting_level)
    |> float.to_precision(3)
    |> float.to_string
    <> "%"
  let ship_icon = case model.current_ship {
    option.None -> get_ship_no_selected_icon()
    option.Some(ship_id) -> {
      let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
      get_ship_selected_icon(ship_entry)
    }
  }
  html.aside(
    [
      attribute.class(
        "fixed top-0 left-0 w-16 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-4 border-b border-gray-200 flex justify-center items-center",
          ),
        ],
        [
          html.button(
            [
              attribute("title", "Toggle Sidebar"),
              attribute.class("p-1 rounded-md hover:bg-gray-100"),
              attribute.id("toggle-sidebar"),
              event.on_click(mvu.UserClickedExpandSidebar),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute("d", "M13 5l7 7-7 7M5 5l7 7-7 7"),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
        ],
      ),
      html.div([attribute.class("flex flex-col items-center pt-4 space-y-6")], [
        html.div([attribute.class("flex flex-col items-center")], [
          html.div(
            [
              attribute.class(
                "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mb-1",
              ),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6 text-gray-600"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute(
                      "d",
                      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    ),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
          html.span([attribute.class("text-xs font-medium")], [
            html.text(collateral_amount_string),
          ]),
        ]),
        html.div([attribute.class("flex flex-col items-center")], [
          html.div(
            [
              attribute.class(
                "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mb-1",
              ),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6 text-gray-600"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute(
                      "d",
                      "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
                    ),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
          html.span([attribute.class("text-xs font-medium text-selected")], [
            html.text(accounting_level_string),
          ]),
          html.span([attribute.class("text-[10px] text-gray-500")], [
            html.text(tax_rate_string),
          ]),
        ]),
        ship_icon,
      ]),
    ],
  )
}

fn get_ship_no_selected_icon() -> element.Element(mvu.Msg) {
  html.div([attribute.class("flex flex-col items-center")], [
    html.div(
      [
        attribute.class(
          "w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mb-1 text-gray-600 font-bold text-lg",
        ),
      ],
      [
        html.text(
          "Ø
                ",
        ),
      ],
    ),
    html.span(
      [attribute.class("text-xs font-medium text-gray-500 text-center")],
      [html.text("No Ship Selected")],
    ),
  ])
}

fn get_ship_selected_icon(ship_entry: mvu.ShipEntry) -> element.Element(mvu.Msg) {
  let total_capacity =
    dict.fold(ship_entry.ship.holds, 0.0, fn(acc, _id, hold) {
      acc +. hold.capacity
    })
  let capacity_string =
    numbers.int_to_human_string(total_capacity |> float.truncate) <> " m³"
  let assert Ok(#(ship_letter_string, _rest)) =
    ship_entry.ship.name |> string.pop_grapheme
  html.div([attribute.class("flex flex-col items-center")], [
    html.div(
      [
        attribute.class(
          "w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md mb-1 text-white font-bold",
        ),
      ],
      [html.text(ship_letter_string)],
    ),
    html.span([attribute.class("text-xs font-medium")], [
      html.text(capacity_string),
    ]),
  ])
}
