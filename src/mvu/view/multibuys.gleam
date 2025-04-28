import arbitrage
import gleam/list
import gleam/option.{type Option, Some}
import gleam/result
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu
import util/numbers

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  let multibuys =
    list.map(model.trades, fn(trade) {
      case trade {
        mvu.Multibuy(multibuy) -> Ok(get_multibuy(multibuy))
        _ -> Error(Nil)
      }
    })
    |> result.all
    |> result.unwrap([])
  html.section(
    [],
    [
      get_compute_multibuy_button(
        model.current_ship,
        model.collateral,
        model.source,
        model.destination,
      ),
      html.h2([attribute.class("text-2xl font-bold mb-4")], [
        html.text("Arbitrage Multibuys"),
      ]),
    ]
      |> list.append(multibuys),
  )
}

fn get_compute_multibuy_button(
  selected_ship: Option(Int),
  collateral: Option(Int),
  source: Option(String),
  destination: Option(String),
) -> element.Element(mvu.Msg) {
  case selected_ship, collateral, source, destination {
    Some(_), Some(_), Some(_), Some(_) -> get_active_compute_multibuys_button()
    _, _, _, _ -> get_inactive_compute_multibuys_button()
  }
}

fn get_active_compute_multibuys_button() -> element.Element(mvu.Msg) {
  html.div([attribute.class("flex justify-center my-8")], [
    html.button(
      [
        attribute.class(
          "bg-selected hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center transition-colors duration-200",
        ),
        event.on_click(mvu.UserClickedComputeMultibuys),
      ],
      [
        svg.svg(
          [
            attribute("stroke", "currentColor"),
            attribute("viewBox", "0 0 24 24"),
            attribute("fill", "none"),
            attribute.class("h-5 w-5 mr-2"),
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
        html.text(
          "Compute Multibuys
                    ",
        ),
      ],
    ),
  ])
}

fn get_inactive_compute_multibuys_button() -> element.Element(mvu.Msg) {
  html.div([attribute.class("flex justify-center my-8")], [
    html.button(
      [
        attribute.class(
          "bg-gray-400 text-gray-200 font-bold py-3 px-8 rounded-lg shadow-md flex items-center cursor-not-allowed opacity-70",
        ),
        attribute.disabled(True),
      ],
      [
        svg.svg(
          [
            attribute("stroke", "currentColor"),
            attribute("viewBox", "0 0 24 24"),
            attribute("fill", "none"),
            attribute.class("h-5 w-5 mr-2"),
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
        html.text(
          "Compute Multibuys
                    ",
        ),
      ],
    ),
  ])
}

fn get_multibuy(multibuy: arbitrage.Multibuy) -> element.Element(mvu.Msg) {
  html.div([attribute.class("mb-6")], [
    html.div([attribute.class("relative bg-white rounded-t-lg shadow-md")], [
      html.div([attribute.class("absolute top-3 right-3")], [
        html.button(
          [
            attribute("title", "Copy to clipboard"),
            attribute.class("p-1 hover:bg-gray-100 rounded"),
            event.on_click(mvu.UserClickedCopyMultibuy(multibuy)),
          ],
          [
            svg.svg(
              [
                attribute("stroke", "currentColor"),
                attribute("viewBox", "0 0 24 24"),
                attribute("fill", "none"),
                attribute.class("h-5 w-5 text-gray-500"),
                attribute("xmlns", "http://www.w3.org/2000/svg"),
              ],
              [
                svg.path([
                  attribute(
                    "d",
                    "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3",
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
      html.div(
        [
          attribute("aria-readonly", "true"),
          attribute.class(
            "p-4 bg-gray-50 rounded-t-lg text-gray-700 font-mono text-sm h-24 overflow-y-auto",
          ),
        ],
        list.map(arbitrage.get_multibuy_purchases(multibuy), fn(purchase) {
          [html.text(arbitrage.purchase_to_string(purchase)), html.br([])]
        })
          |> list.flatten,
      ),
    ]),
    html.div(
      [
        attribute.class(
          "bg-white rounded-b-lg shadow-md p-3 border-t border-gray-200",
        ),
      ],
      [
        html.div([attribute.class("flex justify-between items-center")], [
          html.span([attribute.class("font-medium text-gray-700")], [
            html.text("Total Price:"),
          ]),
          html.span([attribute.class("font-bold text-gray-900")], [
            html.text(
              numbers.float_to_human_string(arbitrage.get_multibuy_total_price(
                multibuy,
              ))
              <> " ISK",
            ),
          ]),
        ]),
      ],
    ),
  ])
}
