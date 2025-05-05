import gleam/int
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import mvu

pub fn get_section(collateral: Option(Int)) -> element.Element(mvu.Msg) {
  let collateral_input = case collateral {
    None -> get_empty_collateral()
    Some(value) -> get_set_collateral(value)
  }
  html.div([attribute.class("p-4 border-b border-gray-200")], [
    html.label(
      [
        attribute.class("block text-sm font-medium text-gray-700 mb-1"),
        attribute.for("max-collateral"),
      ],
      [html.text("Max Collateral")],
    ),
    html.div([attribute.class("relative rounded-md shadow-sm")], [
      html.div(
        [
          attribute.class(
            "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
          ),
        ],
        [
          html.span([attribute.class("text-gray-500 sm:text-sm")], [
            html.text("ISK"),
          ]),
        ],
      ),
      collateral_input,
      html.div(
        [
          attribute.class(
            "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none",
          ),
        ],
        [
          html.span([attribute.class("text-gray-500 sm:text-sm")], [
            html.text("million"),
          ]),
        ],
      ),
    ]),
  ])
}

fn get_empty_collateral() -> element.Element(mvu.Msg) {
  html.input([
    attribute.placeholder("0"),
    attribute.step("1"),
    attribute.class(
      "focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border",
    ),
    attribute.id("max-collateral"),
    attribute.name("max-collateral"),
    attribute.type_("number"),
    event.on_input(mvu.int_input_to_msg(_, mvu.UserUpdatedCollateral)),
  ])
}

fn get_set_collateral(value: Int) -> element.Element(mvu.Msg) {
  html.input([
    attribute.placeholder("0"),
    attribute.class(
      "focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border",
    ),
    attribute.id("max-collateral"),
    attribute.name("max-collateral"),
    attribute.type_("number"),
    attribute.value(value |> int.to_string),
    event.on_input(fn(input) {
      let value =
        int.parse(input)
        |> option.from_result
      mvu.UserUpdatedCollateral(value)
    }),
  ])
}
