import config/esi
import config/sde
import gleam/list
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import mvu
import mvu/view/multibuys
import mvu/view/systems_lists

pub fn run(model: mvu.Model) -> element.Element(mvu.Msg) {
  let systems_lists = systems_lists.get_section(model)
  let multibuys = multibuys.get_section(model)
  let page_contents = [systems_lists, multibuys]
  html.div([attribute.class("max-w-6xl mx-auto")], page_contents)
}
