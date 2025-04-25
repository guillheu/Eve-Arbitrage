import { Ok, Error } from "./gleam.mjs";


export function value(element) {
    let value = element.value;
    if (value != undefined) {
      return new Ok(value);
    }
    return new Error();
  }
  

export function getElementById(id) {
    let found = document.getElementById(id);
    if (!found) {
      return new Error();
    }
    return new Ok(found);
  }