import arbitrage
import gleam/float
import gleam/int
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/event
import mvu

pub fn get_section(level: Int) -> element.Element(mvu.Msg) {
  let level_string = level |> int.to_string
  let effective_tax_rate_string =
    arbitrage.tax_percent_from_accounting_level(level)
    |> float.to_precision(3)
    |> float.to_string
  html.div([attribute.class("p-4 border-b border-gray-200")], [
    html.div([attribute.class("flex justify-between items-center mb-2")], [
      html.label(
        [
          attribute.class("block text-sm font-medium text-gray-700"),
          attribute.for("accounting-level"),
        ],
        [html.text("Accounting Level")],
      ),
      html.span([attribute.class("text-sm font-medium text-selected")], [
        html.text(level_string),
      ]),
    ]),
    html.div([attribute.class("relative mb-6")], [
      html.input([
        attribute.class(
          "w-full h-1 bg-gray-200 rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-selected focus:ring-opacity-50",
        ),
        attribute.id("accounting-level"),
        attribute.step("1"),
        attribute.value(level_string),
        attribute.max("5"),
        attribute.min("0"),
        attribute.type_("range"),
        event.on_input(fn(input_string) {
          let assert Ok(level) = int.parse(input_string)
          mvu.UserUpdatedAccountingLevel(level)
        }),
      ]),
    ]),
    html.div(
      [attribute.class("flex justify-between text-xs text-gray-500 px-1")],
      [
        html.span([], [html.text("0")]),
        html.span([], [html.text("1")]),
        html.span([], [html.text("2")]),
        html.span([], [html.text("3")]),
        html.span([], [html.text("4")]),
        html.span([], [html.text("5")]),
      ],
    ),
    html.div([attribute.class("mt-2 text-xs text-gray-500")], [
      html.span([], [html.text("Effective tax rate: ")]),
      html.span([attribute.class("font-medium text-gray-700")], [
        html.text(effective_tax_rate_string <> "%"),
      ]),
    ]),
  ])
}
