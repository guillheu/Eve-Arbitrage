// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length4 = 0;
    while (current) {
      current = current.tail;
      length4++;
    }
    return length4 - 1;
  }
};
function prepend(element3, tail) {
  return new NonEmpty(element3, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a2 = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a2 !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a2 = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a2 >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a2 = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var UtfCodepoint = class {
  constructor(value3) {
    this.value = value3;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name2, message) {
  if (isBitArrayDeprecationMessagePrinted[name2]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name2} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name2] = true;
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a2 = values3.pop();
    let b = values3.pop();
    if (a2 === b) continue;
    if (!isObject(a2) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get3] = getters(a2);
    for (let k of keys2(a2)) {
      values3.push(get3(a2, k), get3(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return !(a2 instanceof BitArray) && a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c)) return false;
  return a2.constructor === b.constructor;
}
function remainderInt(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 % b;
  }
}
function divideInt(a2, b) {
  return Math.trunc(divideFloat(a2, b));
}
function divideFloat(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 / b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function is_none(option2) {
  return isEqual(option2, new None());
}
function to_result(option2, e) {
  if (option2 instanceof Some) {
    let a2 = option2[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result.isOk()) {
    let a2 = result[0];
    return new Some(a2);
  } else {
    return new None();
  }
}
function unwrap(option2, default$) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return x;
  } else {
    return default$;
  }
}
function lazy_unwrap(option2, default$) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return x;
  } else {
    return default$();
  }
}
function map(option2, fun) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function compare(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a2 < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function negate(x) {
  return -1 * x;
}
function round2(x) {
  let $ = x >= 0;
  if ($) {
    return round(x);
  } else {
    return 0 - round(negate(x));
  }
}
function to_precision(x, precision) {
  let $ = precision <= 0;
  if ($) {
    let factor = power(10, identity(-precision));
    return identity(round2(divideFloat(x, factor))) * factor;
  } else {
    let factor = power(10, identity(precision));
    return divideFloat(identity(round2(x * factor)), factor);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function compare2(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a2 < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count = loop$count;
    if (list4.atLeastLength(1)) {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length(list4) {
  return length_loop(list4, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function is_empty(list4) {
  return isEqual(list4, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list4 = loop$list;
    let elem = loop$elem;
    if (list4.hasLength(0)) {
      return false;
    } else if (list4.atLeastLength(1) && isEqual(list4.head, elem)) {
      let first$1 = list4.head;
      return true;
    } else {
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$elem = elem;
    }
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list4, fun) {
  return try_map_loop(list4, fun, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list4;
    } else {
      if (list4.hasLength(0)) {
        return toList([]);
      } else {
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first.hasLength(0)) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list4, item) {
  return prepend(item, list4);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list4 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list4, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function find_map(loop$list, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return new Error(void 0);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        return new Ok(first$2);
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function all(loop$list, loop$predicate) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    if (list4.hasLength(0)) {
      return true;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
      } else {
        return false;
      }
    }
  }
}
function intersperse_loop(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(first$1, prepend(separator, acc));
    }
  }
}
function intersperse(list4, elem) {
  if (list4.hasLength(0)) {
    return list4;
  } else if (list4.hasLength(1)) {
    return list4;
  } else {
    let first$1 = list4.head;
    let rest$1 = list4.tail;
    return intersperse_loop(rest$1, elem, toList([first$1]));
  }
}
function unique_loop(loop$list, loop$seen, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let seen = loop$seen;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = has_key(seen, first$1);
      if ($) {
        loop$list = rest$1;
        loop$seen = seen;
        loop$acc = acc;
      } else {
        loop$list = rest$1;
        loop$seen = insert(seen, first$1, void 0);
        loop$acc = prepend(first$1, acc);
      }
    }
  }
}
function unique(list4) {
  return unique_loop(list4, new_map(), toList([]));
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare5 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare5(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare5;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare5;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare5;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22.hasLength(0)) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare5,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare5;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22.hasLength(0)) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare5,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare5;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare5 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return reverse(sequence);
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare5, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare5;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare5, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare5;
    }
  }
}
function sort(list4, compare5) {
  if (list4.hasLength(0)) {
    return toList([]);
  } else if (list4.hasLength(1)) {
    let x = list4.head;
    return toList([x]);
  } else {
    let x = list4.head;
    let y = list4.tail.head;
    let rest$1 = list4.tail.tail;
    let _block;
    let $ = compare5(x, y);
    if ($ instanceof Lt) {
      _block = new Ascending();
    } else if ($ instanceof Eq) {
      _block = new Ascending();
    } else {
      _block = new Descending();
    }
    let direction = _block;
    let sequences$1 = sequences(
      rest$1,
      compare5,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare5);
  }
}
function key_find(keyword_list, desired_key) {
  return find_map(
    keyword_list,
    (keyword) => {
      let key = keyword[0];
      let value3 = keyword[1];
      let $ = isEqual(key, desired_key);
      if ($) {
        return new Ok(value3);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function transpose(loop$list_of_list) {
  while (true) {
    let list_of_list = loop$list_of_list;
    let take_first = (list4) => {
      if (list4.hasLength(0)) {
        return toList([]);
      } else if (list4.hasLength(1)) {
        let first$1 = list4.head;
        return toList([first$1]);
      } else {
        let first$1 = list4.head;
        return toList([first$1]);
      }
    };
    if (list_of_list.hasLength(0)) {
      return toList([]);
    } else if (list_of_list.atLeastLength(1) && list_of_list.head.hasLength(0)) {
      let rest$1 = list_of_list.tail;
      loop$list_of_list = rest$1;
    } else {
      let rows = list_of_list;
      let _block;
      let _pipe = rows;
      let _pipe$1 = map2(_pipe, take_first);
      _block = flatten(_pipe$1);
      let firsts = _block;
      let rest$1 = transpose(
        map2(rows, (_capture) => {
          return drop(_capture, 1);
        })
      );
      return prepend(firsts, rest$1);
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function is_empty2(str) {
  return str === "";
}
function replace(string5, pattern, substitute) {
  let _pipe = string5;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function compare3(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = less_than(a2, b);
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function slice(string5, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string5) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string5, translated_idx, len);
      }
    } else {
      return string_slice(string5, idx, len);
    }
  }
}
function drop_end(string5, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string5;
  } else {
    return slice(string5, 0, string_length(string5) - num_graphemes);
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings.atLeastLength(1)) {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    } else {
      return accumulator;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string5 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string5;
      loop$times = times - 1;
      loop$acc = acc + string5;
    }
  }
}
function repeat(string5, times) {
  return repeat_loop(string5, times, "");
}
function padding(size2, pad_string) {
  let pad_string_length = string_length(pad_string);
  let num_pads = divideInt(size2, pad_string_length);
  let extra = remainderInt(size2, pad_string_length);
  return repeat(pad_string, num_pads) + slice(pad_string, 0, extra);
}
function pad_start(string5, desired_length, pad_string) {
  let current_length = string_length(string5);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string5;
  } else {
    return padding(to_pad_length, pad_string) + string5;
  }
}
function trim(string5) {
  let _pipe = string5;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (!result.isOk()) {
    return false;
  } else {
    return true;
  }
}
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function unwrap_both(result) {
  if (result.isOk()) {
    let a2 = result[0];
    return a2;
  } else {
    let a2 = result[0];
    return a2;
  }
}
function or(first, second) {
  if (first.isOk()) {
    return first;
  } else {
    return second;
  }
}
function all2(results) {
  return try_map(results, (x) => {
    return x;
  });
}
function replace_error(result, error) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value3) {
  if (/^[-+]?(\d+)$/.test(value3)) {
    return new Ok(parseInt(value3));
  } else {
    return new Error(Nil);
  }
}
function parse_float(value3) {
  if (/^[-+]?(\d+)\.(\d+)([eE][-+]?\d+)?$/.test(value3)) {
    return new Ok(parseFloat(value3));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float3) {
  const string5 = float3.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index5 = string5.indexOf("e");
    if (index5 >= 0) {
      return string5.slice(0, index5) + ".0" + string5.slice(index5);
    } else {
      return string5 + ".0";
    }
  }
}
function string_replace(string5, target, substitute) {
  if (typeof string5.replaceAll !== "undefined") {
    return string5.replaceAll(target, substitute);
  }
  return string5.replace(
    // $& means the whole matched string
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
function string_length(string5) {
  if (string5 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string5.match(/./gsu).length;
  }
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_grapheme(string5) {
  let first;
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    first = iterator.next().value?.segment;
  } else {
    first = string5.match(/./su)?.[0];
  }
  if (first) {
    return new Ok([first, string5.slice(first.length)]);
  } else {
    return new Error(Nil);
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string5) {
  return string5.toLowerCase();
}
function less_than(a2, b) {
  return a2 < b;
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function string_slice(string5, idx, len) {
  if (len <= 0 || idx >= string5.length) {
    return "";
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string5.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length4) {
  return str.slice(from2, from2 + length4);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string5) {
  return string5.replace(trim_start_regex, "");
}
function trim_end(string5) {
  return string5.replace(trim_end_regex, "");
}
function console_log(term) {
  console.log(term);
}
function console_error(term) {
  console.error(term);
}
function bit_array_to_string(bit_array3) {
  if (bit_array3.bitSize % 8 !== 0) {
    return new Error(Nil);
  }
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    if (bit_array3.bitOffset === 0) {
      return new Ok(decoder.decode(bit_array3.rawBuffer));
    } else {
      const buffer = new Uint8Array(bit_array3.byteSize);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = bit_array3.byteAt(i);
      }
      return new Ok(decoder.decode(buffer));
    }
  } catch {
    return new Error(Nil);
  }
}
function round(float3) {
  return Math.round(float3);
}
function truncate(float3) {
  return Math.trunc(float3);
}
function power(base, exponent) {
  return Math.pow(base, exponent);
}
function new_map() {
  return Dict.new();
}
function map_to_list(map6) {
  return List.fromArray(map6.entries());
}
function map_remove(key, map6) {
  return map6.delete(key);
}
function map_get(map6, key) {
  const value3 = map6.get(key, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key, value3, map6) {
  return map6.set(key, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return inspectString(v);
  if (t === "bigint" || Number.isInteger(v)) return v.toString();
  if (t === "number") return float_to_string(v);
  if (Array.isArray(v)) return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List) return inspectList(v);
  if (v instanceof UtfCodepoint) return inspectUtfCodepoint(v);
  if (v instanceof BitArray) return `<<${bit_array_inspect(v, "")}>>`;
  if (v instanceof CustomType) return inspectCustomType(v);
  if (v instanceof Dict) return inspectDict(v);
  if (v instanceof Set) return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map6) {
  let body = "dict.from_list([";
  let first = true;
  map6.forEach((value3, key) => {
    if (!first) body = body + ", ";
    body = body + "#(" + inspect(key) + ", " + inspect(value3) + ")";
    first = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label2) => {
    const value3 = inspect(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value3}` : value3;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list4) {
  return `[${list4.toArray().map(inspect).join(", ")}]`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}
function bit_array_inspect(bits, acc) {
  if (bits.bitSize === 0) {
    return acc;
  }
  for (let i = 0; i < bits.byteSize - 1; i++) {
    acc += bits.byteAt(i).toString();
    acc += ", ";
  }
  if (bits.byteSize * 8 === bits.bitSize) {
    acc += bits.byteAt(bits.byteSize - 1).toString();
  } else {
    const trailingBitsCount = bits.bitSize % 8;
    acc += bits.byteAt(bits.byteSize - 1) >> 8 - trailingBitsCount;
    acc += `:size(${trailingBitsCount})`;
  }
  return acc;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function do_has_key(key, dict3) {
  return !isEqual(map_get(dict3, key), new Error(void 0));
}
function has_key(dict3, key) {
  return do_has_key(key, dict3);
}
function insert(dict3, key, value3) {
  return map_insert(key, value3, dict3);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let key = list4.head[0];
      let value3 = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$initial = insert(initial, key, value3);
    }
  }
}
function from_list(list4) {
  return from_list_loop(list4, new_map());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key = list4.head[0];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(key, acc);
    }
  }
}
function keys(dict3) {
  return do_keys_loop(map_to_list(dict3), toList([]));
}
function do_values_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let value3 = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(value3, acc);
    }
  }
}
function values(dict3) {
  let list_of_pairs = map_to_list(dict3);
  return do_values_loop(list_of_pairs, toList([]));
}
function delete$(dict3, key) {
  return map_remove(key, dict3);
}
function upsert(dict3, key, fun) {
  let $ = map_get(dict3, key);
  if ($.isOk()) {
    let value3 = $[0];
    return insert(dict3, key, fun(new Some(value3)));
  } else {
    return insert(dict3, key, fun(new None()));
  }
}
function fold_loop(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let k = list4.head[0];
      let v = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$initial = fun(initial, k, v);
      loop$fun = fun;
    }
  }
}
function fold2(dict3, initial, fun) {
  return fold_loop(map_to_list(dict3), initial, fun);
}
function do_map_values(f, dict3) {
  let f$1 = (dict4, k, v) => {
    return insert(dict4, k, f(k, v));
  };
  return fold2(dict3, new_map(), f$1);
}
function map_values(dict3, fun) {
  return do_map_values(fun, dict3);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token2 = {};
    const entry = data.get(key, token2);
    if (entry === token2) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value3 of data) {
      if (i === key) return new Ok(new Some(value3));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    const error = new DecodeError2("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element3 of data) {
    const layer = decode2(element3);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function dict(data) {
  if (data instanceof Dict) {
    return new Ok(data);
  }
  if (data instanceof Map || data instanceof WeakMap) {
    return new Ok(Dict.fromMap(data));
  }
  if (data == null) {
    return new Error("Dict");
  }
  if (typeof data !== "object") {
    return new Error("Dict");
  }
  const proto = Object.getPrototypeOf(data);
  if (proto === Object.prototype || proto === null) {
    return new Ok(Dict.fromObject(data));
  }
  return new Error("Dict");
}
function bit_array(data) {
  if (data instanceof BitArray) return new Ok(data);
  if (data instanceof Uint8Array) return new Ok(new BitArray(data));
  return new Error(new BitArray(new Uint8Array()));
}
function float(data) {
  if (typeof data === "number") return new Ok(data);
  return new Error(0);
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path2) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path2;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function decode_dynamic(data) {
  return [data, toList([])];
}
function map4(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders.hasLength(0)) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function recursive(inner) {
  return new Decoder(
    (data) => {
      let decoder = inner();
      return decoder.function(data);
    }
  );
}
var dynamic = /* @__PURE__ */ new Decoder(decode_dynamic);
function decode_error(expected, found) {
  return toList([
    new DecodeError2(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name2, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name2, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_bool2(data) {
  let $ = isEqual(identity(true), data);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data)];
    }
  }
}
function decode_int2(data) {
  return run_dynamic_function(data, "Int", int);
}
function decode_float2(data) {
  return run_dynamic_function(data, "Float", float);
}
function decode_bit_array2(data) {
  return run_dynamic_function(data, "BitArray", bit_array);
}
function new_primitive_decoder(name2, decoding_function) {
  return new Decoder(
    (d) => {
      let $ = decoding_function(d);
      if ($.isOk()) {
        let t = $[0];
        return [t, toList([])];
      } else {
        let zero = $[0];
        return [
          zero,
          toList([new DecodeError2(name2, classify_dynamic(d), toList([]))])
        ];
      }
    }
  );
}
var bool = /* @__PURE__ */ new Decoder(decode_bool2);
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
var float2 = /* @__PURE__ */ new Decoder(decode_float2);
var bit_array2 = /* @__PURE__ */ new Decoder(decode_bit_array2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string2);
function fold_dict(acc, key, value3, key_decoder, value_decoder) {
  let $ = key_decoder(key);
  if ($[1].hasLength(0)) {
    let key$1 = $[0];
    let $1 = value_decoder(value3);
    if ($1[1].hasLength(0)) {
      let value$1 = $1[0];
      let dict$1 = insert(acc[0], key$1, value$1);
      return [dict$1, acc[1]];
    } else {
      let errors = $1[1];
      return push_path([new_map(), errors], toList(["values"]));
    }
  } else {
    let errors = $[1];
    return push_path([new_map(), errors], toList(["keys"]));
  }
}
function dict2(key, value3) {
  return new Decoder(
    (data) => {
      let $ = dict(data);
      if (!$.isOk()) {
        return [new_map(), decode_error("Dict", data)];
      } else {
        let dict$1 = $[0];
        return fold2(
          dict$1,
          [new_map(), toList([])],
          (a2, k, v) => {
            let $1 = a2[1];
            if ($1.hasLength(0)) {
              return fold_dict(a2, k, v, key.function, value3.function);
            } else {
              return a2;
            }
          }
        );
      }
    }
  );
}
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p, k) => {
          return push_path(p, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path2) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map4(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path2,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path2 = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path2.hasLength(0)) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path2.head;
      let path$1 = path2.tail;
      let $ = index2(data, key);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function to_string2(bool4) {
  if (!bool4) {
    return "False";
  } else {
    return "True";
  }
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}
function lazy_guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence();
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity3(x) {
  return x;
}
function decode(string5) {
  try {
    const result = JSON.parse(string5);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string5));
  }
}
function getJsonDecodeError(stdErr, json2) {
  if (isUnexpectedEndOfInput(stdErr)) return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json2);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json2) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json2);
    if (result) return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json2) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json2);
  const byte = toHex(json2[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string5) {
  if (line === 1) return column - 1;
  let currentLn = 1;
  let position = 0;
  string5.split("").find((char, idx) => {
    if (char === "\n") currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_parse(json2, decoder) {
  return then$(
    decode(json2),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json2, decoder) {
  return do_parse(json2, decoder);
}
function bool2(input2) {
  return identity3(input2);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict3) {
    super();
    this.dict = dict3;
  }
};
function new$() {
  return new Set2(new_map());
}
function contains2(set, member) {
  let _pipe = set.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function insert2(set, member) {
  return new Set2(insert(set.dict, member, token));
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var EMPTY_DICT = /* @__PURE__ */ Dict.new();
function empty_dict() {
  return EMPTY_DICT;
}
var EMPTY_SET = /* @__PURE__ */ new$();
function empty_set() {
  return EMPTY_SET;
}
var document2 = globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare4(a2, b) {
  if (a2.name === b.name) {
    return EQ;
  } else if (a2.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name2, value3) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value3;
  }
};
var Property = class extends CustomType {
  constructor(kind, name2, value3) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value3;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name2, handler, include, prevent_default, stop_propagation, immediate2, limit) {
    super();
    this.kind = kind;
    this.name = name2;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.limit = limit;
  }
};
var NoLimit = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
var Debounce = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
var Throttle = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
function limit_equals(a2, b) {
  if (a2 instanceof NoLimit && b instanceof NoLimit) {
    return true;
  } else if (a2 instanceof Debounce && b instanceof Debounce && a2.delay === b.delay) {
    let d1 = a2.delay;
    let d2 = b.delay;
    return true;
  } else if (a2 instanceof Throttle && b instanceof Throttle && a2.delay === b.delay) {
    let d1 = a2.delay;
    let d2 = b.delay;
    return true;
  } else {
    return false;
  }
}
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes.hasLength(0)) {
      return merged;
    } else if (attributes.atLeastLength(2) && attributes.head instanceof Attribute && attributes.head.name === "class" && attributes.tail.head instanceof Attribute && attributes.tail.head.name === "class") {
      let kind = attributes.head.kind;
      let class1 = attributes.head.value;
      let class2 = attributes.tail.head.value;
      let rest = attributes.tail.tail;
      let value3 = class1 + " " + class2;
      let attribute$1 = new Attribute(kind, "class", value3);
      loop$attributes = prepend(attribute$1, rest);
      loop$merged = merged;
    } else if (attributes.atLeastLength(2) && attributes.head instanceof Attribute && attributes.head.name === "style" && attributes.tail.head instanceof Attribute && attributes.tail.head.name === "style") {
      let kind = attributes.head.kind;
      let style1 = attributes.head.value;
      let style2 = attributes.tail.head.value;
      let rest = attributes.tail.tail;
      let value3 = style1 + ";" + style2;
      let attribute$1 = new Attribute(kind, "style", value3);
      loop$attributes = prepend(attribute$1, rest);
      loop$merged = merged;
    } else {
      let attribute$1 = attributes.head;
      let rest = attributes.tail;
      loop$attributes = rest;
      loop$merged = prepend(attribute$1, merged);
    }
  }
}
function prepare(attributes) {
  if (attributes.hasLength(0)) {
    return attributes;
  } else if (attributes.hasLength(1)) {
    return attributes;
  } else {
    let _pipe = attributes;
    let _pipe$1 = sort(_pipe, (a2, b) => {
      return compare4(b, a2);
    });
    return merge(_pipe$1, empty_list);
  }
}
var attribute_kind = 0;
function attribute(name2, value3) {
  return new Attribute(attribute_kind, name2, value3);
}
var property_kind = 1;
function property(name2, value3) {
  return new Property(property_kind, name2, value3);
}
var event_kind = 2;
function event(name2, handler, include, prevent_default, stop_propagation, immediate2, limit) {
  return new Event2(
    event_kind,
    name2,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    limit
  );
}
var debounce_kind = 1;
var throttle_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name2, value3) {
  return attribute(name2, value3);
}
function property2(name2, value3) {
  return property(name2, value3);
}
function boolean_attribute(name2, value3) {
  if (value3) {
    return attribute2(name2, "");
  } else {
    return property2(name2, bool2(false));
  }
}
function class$(name2) {
  return attribute2("class", name2);
}
function id(value3) {
  return attribute2("id", value3);
}
function href(url) {
  return attribute2("href", url);
}
function disabled(is_disabled) {
  return boolean_attribute("disabled", is_disabled);
}
function for$(id2) {
  return attribute2("for", id2);
}
function max(value3) {
  return attribute2("max", value3);
}
function min(value3) {
  return attribute2("min", value3);
}
function name(element_name) {
  return attribute2("name", element_name);
}
function placeholder(text4) {
  return attribute2("placeholder", text4);
}
function selected(is_selected) {
  return boolean_attribute("selected", is_selected);
}
function step(value3) {
  return attribute2("step", value3);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  let _record = empty;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}
function batch(effects) {
  return fold(
    effects,
    empty,
    (acc, eff) => {
      return new Effect(
        fold(eff.synchronous, acc.synchronous, prepend2),
        fold(eff.before_paint, acc.before_paint, prepend2),
        fold(eff.after_paint, acc.after_paint, prepend2)
      );
    }
  );
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get(map6, key) {
  const value3 = map6?.get(key);
  if (value3 != null) {
    return new Ok(value3);
  } else {
    return new Error(void 0);
  }
}
function insert3(map6, key, value3) {
  map6 ??= /* @__PURE__ */ new Map();
  map6.set(key, value3);
  return map6;
}
function remove(map6, key) {
  map6?.delete(key);
  return map6;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index5, parent) {
    super();
    this.index = index5;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path2 = loop$path;
    let candidates = loop$candidates;
    if (candidates.hasLength(0)) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path2, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path2;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index5, key) {
  if (key === "") {
    return new Index(index5, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_index = "\n";
var separator_key = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path2 = loop$path;
    let acc = loop$acc;
    if (path2 instanceof Root) {
      if (acc.hasLength(0)) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path2 instanceof Key) {
      let key = path2.key;
      let parent = path2.parent;
      loop$path = parent;
      loop$acc = prepend(separator_key, prepend(key, acc));
    } else {
      let index5 = path2.index;
      let parent = path2.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_index,
        prepend(to_string(index5), acc)
      );
    }
  }
}
function to_string3(path2) {
  return do_to_string(path2, toList([]));
}
function matches(path2, candidates) {
  if (candidates.hasLength(0)) {
    return false;
  } else {
    return do_matches(to_string3(path2), candidates);
  }
}
var separator_event = "\f";
function event2(path2, event4) {
  return do_to_string(path2, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children, children_count) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
    this.children_count = children_count;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace2, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace2;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace2, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace2;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace2) {
  if (namespace2 === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function advance(node) {
  if (node instanceof Fragment) {
    let children_count = node.children_count;
    return 1 + children_count;
  } else {
    return 1;
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children, children_count) {
  return new Fragment(
    fragment_kind,
    key,
    mapper,
    children,
    keyed_children,
    children_count
  );
}
var element_kind = 1;
function element(key, mapper, namespace2, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace2,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace2)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;
function set_fragment_key(loop$key, loop$children, loop$index, loop$new_children, loop$keyed_children) {
  while (true) {
    let key = loop$key;
    let children = loop$children;
    let index5 = loop$index;
    let new_children = loop$new_children;
    let keyed_children = loop$keyed_children;
    if (children.hasLength(0)) {
      return [reverse(new_children), keyed_children];
    } else if (children.atLeastLength(1) && children.head instanceof Fragment && children.head.key === "") {
      let node = children.head;
      let children$1 = children.tail;
      let child_key = key + "::" + to_string(index5);
      let $ = set_fragment_key(
        child_key,
        node.children,
        0,
        empty_list,
        empty2()
      );
      let node_children = $[0];
      let node_keyed_children = $[1];
      let _block;
      let _record = node;
      _block = new Fragment(
        _record.kind,
        _record.key,
        _record.mapper,
        node_children,
        node_keyed_children,
        _record.children_count
      );
      let new_node = _block;
      let new_children$1 = prepend(new_node, new_children);
      let index$1 = index5 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children;
    } else if (children.atLeastLength(1) && children.head.key !== "") {
      let node = children.head;
      let children$1 = children.tail;
      let child_key = key + "::" + node.key;
      let keyed_node = to_keyed(child_key, node);
      let new_children$1 = prepend(keyed_node, new_children);
      let keyed_children$1 = insert3(
        keyed_children,
        child_key,
        keyed_node
      );
      let index$1 = index5 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children$1;
    } else {
      let node = children.head;
      let children$1 = children.tail;
      let new_children$1 = prepend(node, new_children);
      let index$1 = index5 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children;
    }
  }
}
function to_keyed(key, node) {
  if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else if (node instanceof UnsafeInnerHtml) {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  } else {
    let children = node.children;
    let $ = set_fragment_key(
      key,
      children,
      0,
      empty_list,
      empty2()
    );
    let children$1 = $[0];
    let keyed_children = $[1];
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      children$1,
      keyed_children,
      _record.children_count
    );
  }
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index5, removed, changes, children) {
    super();
    this.index = index5;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from2, count, with$) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
    this.with = with$;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var Remove = class extends CustomType {
  constructor(kind, from2, count) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
  }
};
function new$4(index5, removed, changes, children) {
  return new Patch(index5, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before, count) {
  return new Move(move_kind, key, before, count);
}
var remove_key_kind = 4;
function remove_key(key, count) {
  return new RemoveKey(remove_key_kind, key, count);
}
var replace_kind = 5;
function replace2(from2, count, with$) {
  return new Replace(replace_kind, from2, count, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from2, count) {
  return new Remove(remove_kind, from2, count);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace2, tag, path2) {
  if (tag === "input" && namespace2 === "") {
    return has_dispatched_events(events, path2);
  } else if (tag === "select" && namespace2 === "") {
    return has_dispatched_events(events, path2);
  } else if (tag === "textarea" && namespace2 === "") {
    return has_dispatched_events(events, path2);
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path2 = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (old.hasLength(0) && new$8.hasLength(0)) {
      return new AttributeChange(added, removed, events);
    } else if (old.atLeastLength(1) && old.head instanceof Event2 && new$8.hasLength(0)) {
      let prev = old.head;
      let name2 = old.head.name;
      let old$1 = old.tail;
      let removed$1 = prepend(prev, removed);
      let events$1 = remove_event(events, path2, name2);
      loop$controlled = controlled;
      loop$path = path2;
      loop$mapper = mapper;
      loop$events = events$1;
      loop$old = old$1;
      loop$new = new$8;
      loop$added = added;
      loop$removed = removed$1;
    } else if (old.atLeastLength(1) && new$8.hasLength(0)) {
      let prev = old.head;
      let old$1 = old.tail;
      let removed$1 = prepend(prev, removed);
      loop$controlled = controlled;
      loop$path = path2;
      loop$mapper = mapper;
      loop$events = events;
      loop$old = old$1;
      loop$new = new$8;
      loop$added = added;
      loop$removed = removed$1;
    } else if (old.hasLength(0) && new$8.atLeastLength(1) && new$8.head instanceof Event2) {
      let next = new$8.head;
      let name2 = new$8.head.name;
      let handler = new$8.head.handler;
      let new$1 = new$8.tail;
      let added$1 = prepend(next, added);
      let events$1 = add_event(events, mapper, path2, name2, handler);
      loop$controlled = controlled;
      loop$path = path2;
      loop$mapper = mapper;
      loop$events = events$1;
      loop$old = old;
      loop$new = new$1;
      loop$added = added$1;
      loop$removed = removed;
    } else if (old.hasLength(0) && new$8.atLeastLength(1)) {
      let next = new$8.head;
      let new$1 = new$8.tail;
      let added$1 = prepend(next, added);
      loop$controlled = controlled;
      loop$path = path2;
      loop$mapper = mapper;
      loop$events = events;
      loop$old = old;
      loop$new = new$1;
      loop$added = added$1;
      loop$removed = removed;
    } else {
      let prev = old.head;
      let remaining_old = old.tail;
      let next = new$8.head;
      let remaining_new = new$8.tail;
      let $ = compare4(prev, next);
      if (prev instanceof Attribute && $ instanceof Eq && next instanceof Attribute) {
        let _block;
        let $1 = next.name;
        if ($1 === "value") {
          _block = controlled || prev.value !== next.value;
        } else if ($1 === "checked") {
          _block = controlled || prev.value !== next.value;
        } else if ($1 === "selected") {
          _block = controlled || prev.value !== next.value;
        } else {
          _block = prev.value !== next.value;
        }
        let has_changes = _block;
        let _block$1;
        if (has_changes) {
          _block$1 = prepend(next, added);
        } else {
          _block$1 = added;
        }
        let added$1 = _block$1;
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Property && $ instanceof Eq && next instanceof Property) {
        let _block;
        let $1 = next.name;
        if ($1 === "scrollLeft") {
          _block = true;
        } else if ($1 === "scrollRight") {
          _block = true;
        } else if ($1 === "value") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else if ($1 === "checked") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else if ($1 === "selected") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else {
          _block = !isEqual(prev.value, next.value);
        }
        let has_changes = _block;
        let _block$1;
        if (has_changes) {
          _block$1 = prepend(next, added);
        } else {
          _block$1 = added;
        }
        let added$1 = _block$1;
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Eq && next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        let has_changes = prev.prevent_default !== next.prevent_default || prev.stop_propagation !== next.stop_propagation || prev.immediate !== next.immediate || !limit_equals(
          prev.limit,
          next.limit
        );
        let _block;
        if (has_changes) {
          _block = prepend(next, added);
        } else {
          _block = added;
        }
        let added$1 = _block;
        let events$1 = add_event(events, mapper, path2, name2, handler);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Eq) {
        let name2 = prev.name;
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        let events$1 = remove_event(events, path2, name2);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Eq && next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        let events$1 = add_event(events, mapper, path2, name2, handler);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Eq) {
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Gt && next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path2, name2, handler);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if ($ instanceof Gt) {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Lt) {
        let name2 = prev.name;
        let removed$1 = prepend(prev, removed);
        let events$1 = remove_event(events, path2, name2);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = new$8;
        loop$added = added;
        loop$removed = removed$1;
      } else {
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = new$8;
        loop$added = added;
        loop$removed = removed$1;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path2 = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (old.hasLength(0) && new$8.hasLength(0)) {
      return new Diff(
        new Patch(patch_index, removed, changes, children),
        events
      );
    } else if (old.atLeastLength(1) && new$8.hasLength(0)) {
      let prev = old.head;
      let old$1 = old.tail;
      let _block;
      let $ = prev.key === "" || !contains2(moved, prev.key);
      if ($) {
        _block = removed + advance(prev);
      } else {
        _block = removed;
      }
      let removed$1 = _block;
      let events$1 = remove_child(events, path2, node_index, prev);
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$8;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed$1;
      loop$node_index = node_index;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes;
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events$1;
    } else if (old.hasLength(0) && new$8.atLeastLength(1)) {
      let events$1 = add_children(
        events,
        mapper,
        path2,
        node_index,
        new$8
      );
      let insert5 = insert4(new$8, node_index - moved_offset);
      let changes$1 = prepend(insert5, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else if (old.atLeastLength(1) && new$8.atLeastLength(1) && old.head.key !== new$8.head.key) {
      let prev = old.head;
      let old_remaining = old.tail;
      let next = new$8.head;
      let new_remaining = new$8.tail;
      let next_did_exist = get(old_keyed, next.key);
      let prev_does_exist = get(new_keyed, prev.key);
      let prev_has_moved = contains2(moved, prev.key);
      if (prev_does_exist.isOk() && next_did_exist.isOk() && prev_has_moved) {
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset - advance(prev);
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path2;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events;
      } else if (prev_does_exist.isOk() && next_did_exist.isOk()) {
        let match = next_did_exist[0];
        let count = advance(next);
        let before = node_index - moved_offset;
        let move2 = move(next.key, before, count);
        let changes$1 = prepend(move2, changes);
        let moved$1 = insert2(moved, next.key);
        let moved_offset$1 = moved_offset + count;
        loop$old = prepend(match, old);
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved$1;
        loop$moved_offset = moved_offset$1;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path2;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events;
      } else if (!prev_does_exist.isOk() && next_did_exist.isOk()) {
        let count = advance(prev);
        let moved_offset$1 = moved_offset - count;
        let events$1 = remove_child(events, path2, node_index, prev);
        let remove3 = remove_key(prev.key, count);
        let changes$1 = prepend(remove3, changes);
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset$1;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path2;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      } else if (prev_does_exist.isOk() && !next_did_exist.isOk()) {
        let before = node_index - moved_offset;
        let count = advance(next);
        let events$1 = add_child(events, mapper, path2, node_index, next);
        let insert5 = insert4(toList([next]), before);
        let changes$1 = prepend(insert5, changes);
        loop$old = old;
        loop$old_keyed = old_keyed;
        loop$new = new_remaining;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset + count;
        loop$removed = removed;
        loop$node_index = node_index + count;
        loop$patch_index = patch_index;
        loop$path = path2;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      } else {
        let prev_count = advance(prev);
        let next_count = advance(next);
        let change = replace2(node_index - moved_offset, prev_count, next);
        let _block;
        let _pipe = events;
        let _pipe$1 = remove_child(_pipe, path2, node_index, prev);
        _block = add_child(_pipe$1, mapper, path2, node_index, next);
        let events$1 = _block;
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new_remaining;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset - prev_count + next_count;
        loop$removed = removed;
        loop$node_index = node_index + next_count;
        loop$patch_index = patch_index;
        loop$path = path2;
        loop$changes = prepend(change, changes);
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old.atLeastLength(1) && old.head instanceof Fragment && new$8.atLeastLength(1) && new$8.head instanceof Fragment) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$8.head;
      let new$1 = new$8.tail;
      let node_index$1 = node_index + 1;
      let prev_count = prev.children_count;
      let next_count = next.children_count;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child = do_diff(
        prev.children,
        prev.keyed_children,
        next.children,
        next.keyed_children,
        empty_set(),
        moved_offset,
        0,
        node_index$1,
        -1,
        path2,
        empty_list,
        children,
        composed_mapper,
        events
      );
      let _block;
      let $ = child.patch.removed > 0;
      if ($) {
        let remove_from = node_index$1 + next_count - moved_offset;
        let patch = remove2(remove_from, child.patch.removed);
        _block = append(child.patch.changes, prepend(patch, changes));
      } else {
        _block = append(child.patch.changes, changes);
      }
      let changes$1 = _block;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset + next_count - prev_count;
      loop$removed = removed;
      loop$node_index = node_index$1 + next_count;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes$1;
      loop$children = child.patch.children;
      loop$mapper = mapper;
      loop$events = child.events;
    } else if (old.atLeastLength(1) && old.head instanceof Element && new$8.atLeastLength(1) && new$8.head instanceof Element && (old.head.namespace === new$8.head.namespace && old.head.tag === new$8.head.tag)) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$8.head;
      let new$1 = new$8.tail;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child_path = add2(path2, node_index, next.key);
      let controlled = is_controlled(
        events,
        next.namespace,
        next.tag,
        child_path
      );
      let $ = diff_attributes(
        controlled,
        child_path,
        composed_mapper,
        events,
        prev.attributes,
        next.attributes,
        empty_list,
        empty_list
      );
      let added_attrs = $.added;
      let removed_attrs = $.removed;
      let events$1 = $.events;
      let _block;
      if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
        _block = empty_list;
      } else {
        _block = toList([update(added_attrs, removed_attrs)]);
      }
      let initial_child_changes = _block;
      let child = do_diff(
        prev.children,
        prev.keyed_children,
        next.children,
        next.keyed_children,
        empty_set(),
        0,
        0,
        0,
        node_index,
        child_path,
        initial_child_changes,
        empty_list,
        composed_mapper,
        events$1
      );
      let _block$1;
      let $1 = child.patch;
      if ($1 instanceof Patch && $1.removed === 0 && $1.changes.hasLength(0) && $1.children.hasLength(0)) {
        _block$1 = children;
      } else {
        _block$1 = prepend(child.patch, children);
      }
      let children$1 = _block$1;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes;
      loop$children = children$1;
      loop$mapper = mapper;
      loop$events = child.events;
    } else if (old.atLeastLength(1) && old.head instanceof Text && new$8.atLeastLength(1) && new$8.head instanceof Text && old.head.content === new$8.head.content) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$8.head;
      let new$1 = new$8.tail;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes;
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events;
    } else if (old.atLeastLength(1) && old.head instanceof Text && new$8.atLeastLength(1) && new$8.head instanceof Text) {
      let old$1 = old.tail;
      let next = new$8.head;
      let new$1 = new$8.tail;
      let child = new$4(
        node_index,
        0,
        toList([replace_text(next.content)]),
        empty_list
      );
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes;
      loop$children = prepend(child, children);
      loop$mapper = mapper;
      loop$events = events;
    } else if (old.atLeastLength(1) && old.head instanceof UnsafeInnerHtml && new$8.atLeastLength(1) && new$8.head instanceof UnsafeInnerHtml) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$8.head;
      let new$1 = new$8.tail;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child_path = add2(path2, node_index, next.key);
      let $ = diff_attributes(
        false,
        child_path,
        composed_mapper,
        events,
        prev.attributes,
        next.attributes,
        empty_list,
        empty_list
      );
      let added_attrs = $.added;
      let removed_attrs = $.removed;
      let events$1 = $.events;
      let _block;
      if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
        _block = empty_list;
      } else {
        _block = toList([update(added_attrs, removed_attrs)]);
      }
      let child_changes = _block;
      let _block$1;
      let $1 = prev.inner_html === next.inner_html;
      if ($1) {
        _block$1 = child_changes;
      } else {
        _block$1 = prepend(
          replace_inner_html(next.inner_html),
          child_changes
        );
      }
      let child_changes$1 = _block$1;
      let _block$2;
      if (child_changes$1.hasLength(0)) {
        _block$2 = children;
      } else {
        _block$2 = prepend(
          new$4(node_index, 0, child_changes$1, toList([])),
          children
        );
      }
      let children$1 = _block$2;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = changes;
      loop$children = children$1;
      loop$mapper = mapper;
      loop$events = events$1;
    } else {
      let prev = old.head;
      let old_remaining = old.tail;
      let next = new$8.head;
      let new_remaining = new$8.tail;
      let prev_count = advance(prev);
      let next_count = advance(next);
      let change = replace2(node_index - moved_offset, prev_count, next);
      let _block;
      let _pipe = events;
      let _pipe$1 = remove_child(_pipe, path2, node_index, prev);
      _block = add_child(_pipe$1, mapper, path2, node_index, next);
      let events$1 = _block;
      loop$old = old_remaining;
      loop$old_keyed = old_keyed;
      loop$new = new_remaining;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset - prev_count + next_count;
      loop$removed = removed;
      loop$node_index = node_index + next_count;
      loop$patch_index = patch_index;
      loop$path = path2;
      loop$changes = prepend(change, changes);
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events$1;
    }
  }
}
function diff(events, old, new$8) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$8]),
    empty2(),
    empty_set(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var Reconciler = class {
  offset = 0;
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  constructor(root3, dispatch, { useServerEvents = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
  }
  mount(vdom) {
    appendChild(this.#root, this.#createElement(vdom));
  }
  #stack = [];
  push(patch) {
    const offset = this.offset;
    if (offset) {
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
          case move_kind:
            change.before = (change.before | 0) + offset;
            break;
          case remove_kind:
          case replace_kind:
            change.from = (change.from | 0) + offset;
            break;
        }
      });
      iterate(patch.children, (child) => {
        child.index = (child.index | 0) + offset;
      });
    }
    this.#stack.push({ node: this.#root, patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #reconcile() {
    const self = this;
    while (self.#stack.length) {
      const { node, patch } = self.#stack.pop();
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
            self.#insert(node, change.children, change.before);
            break;
          case move_kind:
            self.#move(node, change.key, change.before, change.count);
            break;
          case remove_key_kind:
            self.#removeKey(node, change.key, change.count);
            break;
          case remove_kind:
            self.#remove(node, change.from, change.count);
            break;
          case replace_kind:
            self.#replace(node, change.from, change.count, change.with);
            break;
          case replace_text_kind:
            self.#replaceText(node, change.content);
            break;
          case replace_inner_html_kind:
            self.#replaceInnerHtml(node, change.inner_html);
            break;
          case update_kind:
            self.#update(node, change.added, change.removed);
            break;
        }
      });
      if (patch.removed) {
        self.#remove(
          node,
          node.childNodes.length - patch.removed,
          patch.removed
        );
      }
      iterate(patch.children, (child) => {
        self.#stack.push({ node: childAt(node, child.index), patch: child });
      });
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(node, children, before) {
    const fragment3 = createDocumentFragment();
    iterate(children, (child) => {
      const el = this.#createElement(child);
      addKeyedChild(node, el);
      appendChild(fragment3, el);
    });
    insertBefore(node, fragment3, childAt(node, before));
  }
  #move(node, key, before, count) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count) {
    this.#removeFromChild(node, getKeyedChild(node, key), count);
  }
  #remove(node, from2, count) {
    this.#removeFromChild(node, childAt(node, from2), count);
  }
  #removeFromChild(parent, child, count) {
    while (count-- > 0 && child !== null) {
      const next = child.nextSibling;
      const key = child[meta].key;
      if (key) {
        parent[meta].keyedChildren.delete(key);
      }
      for (const [_, { timeout }] of child[meta].debouncers) {
        clearTimeout(timeout);
      }
      parent.removeChild(child);
      child = next;
    }
  }
  #replace(parent, from2, count, child) {
    this.#remove(parent, from2, count);
    const el = this.#createElement(child);
    addKeyedChild(parent, el);
    insertBefore(parent, el, childAt(parent, from2));
  }
  #replaceText(node, content) {
    node.data = content ?? "";
  }
  #replaceInnerHtml(node, inner_html) {
    node.innerHTML = inner_html ?? "";
  }
  #update(node, added, removed) {
    iterate(removed, (attribute3) => {
      const name2 = attribute3.name;
      if (node[meta].handlers.has(name2)) {
        node.removeEventListener(name2, handleEvent);
        node[meta].handlers.delete(name2);
        if (node[meta].throttles.has(name2)) {
          node[meta].throttles.delete(name2);
        }
        if (node[meta].debouncers.has(name2)) {
          clearTimeout(node[meta].debouncers.get(name2).timeout);
          node[meta].debouncers.delete(name2);
        }
      } else {
        node.removeAttribute(name2);
        ATTRIBUTE_HOOKS[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute3) => {
      this.#createAttribute(node, attribute3);
    });
  }
  // CONSTRUCTORS --------------------------------------------------------------
  #createElement(vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#insert(node, vnode.children, 0);
        return node;
      }
      case text_kind: {
        const node = createTextNode(vnode.content);
        initialiseMetadata(node, vnode.key);
        return node;
      }
      case fragment_kind: {
        const node = createDocumentFragment();
        const head = createTextNode();
        initialiseMetadata(head, vnode.key);
        appendChild(node, head);
        iterate(vnode.children, (child) => {
          appendChild(node, this.#createElement(child));
        });
        return node;
      }
      case unsafe_inner_html_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#replaceInnerHtml(node, vnode.inner_html);
        return node;
      }
    }
  }
  #createAttributes(node, { attributes }) {
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #createAttribute(node, attribute3) {
    const nodeMeta = node[meta];
    switch (attribute3.kind) {
      case attribute_kind: {
        const name2 = attribute3.name;
        const value3 = attribute3.value ?? "";
        if (value3 !== node.getAttribute(name2)) {
          node.setAttribute(name2, value3);
        }
        ATTRIBUTE_HOOKS[name2]?.added?.(node, value3);
        break;
      }
      case property_kind:
        node[attribute3.name] = attribute3.value;
        break;
      case event_kind: {
        if (!nodeMeta.handlers.has(attribute3.name)) {
          node.addEventListener(attribute3.name, handleEvent, {
            passive: !attribute3.prevent_default
          });
        }
        const prevent = attribute3.prevent_default;
        const stop = attribute3.stop_propagation;
        const immediate2 = attribute3.immediate;
        const include = Array.isArray(attribute3.include) ? attribute3.include : [];
        if (attribute3.limit?.kind === throttle_kind) {
          const throttle = nodeMeta.throttles.get(attribute3.name) ?? {
            last: 0,
            delay: attribute3.limit.delay
          };
          nodeMeta.throttles.set(attribute3.name, throttle);
        }
        if (attribute3.limit?.kind === debounce_kind) {
          const debounce = nodeMeta.debouncers.get(attribute3.name) ?? {
            timeout: null,
            delay: attribute3.limit.delay
          };
          nodeMeta.debouncers.set(attribute3.name, debounce);
        }
        nodeMeta.handlers.set(attribute3.name, (event4) => {
          if (prevent) event4.preventDefault();
          if (stop) event4.stopPropagation();
          const type = event4.type;
          let path2 = "";
          let pathNode = event4.currentTarget;
          while (pathNode !== this.#root) {
            const key = pathNode[meta].key;
            const parent = pathNode.parentNode;
            if (key) {
              path2 = `${separator_key}${key}${path2}`;
            } else {
              const siblings = parent.childNodes;
              let index5 = [].indexOf.call(siblings, pathNode);
              if (parent === this.#root) {
                index5 -= this.offset;
              }
              path2 = `${separator_index}${index5}${path2}`;
            }
            pathNode = parent;
          }
          path2 = path2.slice(1);
          const data = this.#useServerEvents ? createServerEvent(event4, include) : event4;
          if (nodeMeta.throttles.has(type)) {
            const throttle = nodeMeta.throttles.get(type);
            const now = Date.now();
            const last = throttle.last || 0;
            if (now > last + throttle.delay) {
              throttle.last = now;
              this.#dispatch(data, path2, type, immediate2);
            } else {
              event4.preventDefault();
            }
          } else if (nodeMeta.debouncers.has(type)) {
            const debounce = nodeMeta.debouncers.get(type);
            clearTimeout(debounce.timeout);
            debounce.timeout = setTimeout(() => {
              this.#dispatch(data, path2, type, immediate2);
            }, debounce.delay);
          } else {
            this.#dispatch(data, path2, type, immediate2);
          }
        });
        break;
      }
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.tail; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var appendChild = (node, child) => node.appendChild(child);
var insertBefore = (parent, node, referenceNode) => parent.insertBefore(node, referenceNode ?? null);
var createElement = ({ key, tag, namespace: namespace2 }) => {
  const node = document2.createElementNS(namespace2 || NAMESPACE_HTML, tag);
  initialiseMetadata(node, key);
  return node;
};
var createTextNode = (text4) => document2.createTextNode(text4 ?? "");
var createDocumentFragment = () => document2.createDocumentFragment();
var childAt = (node, at) => node.childNodes[at | 0];
var meta = Symbol("lustre");
var initialiseMetadata = (node, key = "") => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node[meta] = {
        key,
        keyedChildren: /* @__PURE__ */ new Map(),
        handlers: /* @__PURE__ */ new Map(),
        throttles: /* @__PURE__ */ new Map(),
        debouncers: /* @__PURE__ */ new Map()
      };
      break;
    case TEXT_NODE:
      node[meta] = { key, debouncers: /* @__PURE__ */ new Map() };
      break;
  }
};
var addKeyedChild = (node, child) => {
  if (child.nodeType === DOCUMENT_FRAGMENT_NODE) {
    for (child = child.firstChild; child; child = child.nextSibling) {
      addKeyedChild(node, child);
    }
    return;
  }
  const key = child[meta].key;
  if (key) {
    node[meta].keyedChildren.set(key, new WeakRef(child));
  }
};
var getKeyedChild = (node, key) => node[meta].keyedChildren.get(key).deref();
var handleEvent = (event4) => {
  const target = event4.currentTarget;
  const handler = target[meta].handlers.get(event4.type);
  if (event4.type === "submit") {
    event4.detail ??= {};
    event4.detail.formData = [...new FormData(event4.target).entries()];
  }
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path2 = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path2.length; i++) {
      if (i === path2.length - 1) {
        output[path2[i]] = input2[path2[i]];
        break;
      }
      output = output[path2[i]] ??= {};
      input2 = input2[path2[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = (name2) => {
  return {
    added(node, value3) {
      node[name2] = value3;
    }
  };
};
var ATTRIBUTE_HOOKS = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => node.focus?.());
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const vdom = virtualise_node(root3);
  if (vdom === null || vdom.children instanceof Empty) {
    const empty6 = empty_text_node();
    initialiseMetadata(empty6);
    root3.appendChild(empty6);
    return none2();
  } else if (vdom.children instanceof NonEmpty && vdom.children.tail instanceof Empty) {
    return vdom.children.head;
  } else {
    const head = empty_text_node();
    initialiseMetadata(head);
    root3.insertBefore(head, root3.firstChild);
    return fragment2(vdom.children);
  }
};
var empty_text_node = () => {
  return document2.createTextNode("");
};
var virtualise_node = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const key = node.getAttribute("data-lustre-key");
      initialiseMetadata(node, key);
      if (key) {
        node.removeAttribute("data-lustre-key");
      }
      const tag = node.localName;
      const namespace2 = node.namespaceURI;
      const isHtmlElement = !namespace2 || namespace2 === NAMESPACE_HTML;
      if (isHtmlElement && input_elements.includes(tag)) {
        virtualise_input_events(tag, node);
      }
      const attributes = virtualise_attributes(node);
      const children = virtualise_child_nodes(node);
      const vnode = isHtmlElement ? element2(tag, attributes, children) : namespaced(namespace2, tag, attributes, children);
      return key ? to_keyed(key, vnode) : vnode;
    }
    case TEXT_NODE:
      initialiseMetadata(node);
      return text2(node.data);
    case DOCUMENT_FRAGMENT_NODE:
      initialiseMetadata(node);
      return node.childNodes.length > 0 ? fragment2(virtualise_child_nodes(node)) : null;
    default:
      return null;
  }
};
var input_elements = ["input", "select", "textarea"];
var virtualise_input_events = (tag, node) => {
  const value3 = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value3) return;
  queueMicrotask(() => {
    node.value = value3;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document2.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualise_child_nodes = (node) => {
  let children = empty_list;
  let child = node.lastChild;
  while (child) {
    const vnode = virtualise_node(child);
    const next = child.previousSibling;
    if (vnode) {
      children = new NonEmpty(vnode, children);
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  return children;
};
var virtualise_attributes = (node) => {
  let index5 = node.attributes.length;
  let attributes = empty_list;
  while (index5-- > 0) {
    attributes = new NonEmpty(
      virtualise_attribute(node.attributes[index5]),
      attributes
    );
  }
  return attributes;
};
var virtualise_attribute = (attr) => {
  const name2 = attr.localName;
  const value3 = attr.value;
  return attribute2(name2, value3);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document2;
var is_reference_equal = (a2, b) => a2 === b;
var Runtime = class {
  constructor(root3, [model, effects], view, update2) {
    this.root = root3;
    this.#model = model;
    this.#view = view;
    this.#update = update2;
    this.#reconciler = new Reconciler(this.root, (event4, path2, name2) => {
      const [events, msg] = handle(this.#events, path2, name2, event4);
      this.#events = events;
      if (msg.isOk()) {
        this.dispatch(msg[0], false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$5();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  set offset(offset) {
    this.#reconciler.offset = offset;
  }
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a2, b) {
  if (a2 instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a2;
  } else {
    return append(a2, b);
  }
}

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$5() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path2, name2) {
  return remove(handlers, event2(path2, name2));
}
function remove_event(events, path2, name2) {
  let handlers = do_remove_event(events.handlers, path2, name2);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path2, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        return do_remove_event(events, path2, name2);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path2, name2, event4) {
  let next_dispatched_paths = prepend(path2, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get(
    events$1.handlers,
    path2 + separator_event + name2
  );
  if ($.isOk()) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path2) {
  return matches(path2, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path2, name2, handler) {
  return insert3(
    handlers,
    event2(path2, name2),
    map4(handler, identity2(mapper))
  );
}
function add_event(events, mapper, path2, name2, handler) {
  let handlers = do_add_event(events.handlers, mapper, path2, name2, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path2, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path2, name2, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = is_reference_equal(mapper, identity2);
  let $1 = is_reference_equal(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($ && !$1) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path2 = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children.hasLength(0)) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path2, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path2;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path2 = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path2, attributes);
    return do_remove_children(_pipe$1, path2, 0, children);
  } else if (child instanceof Fragment) {
    let children = child.children;
    return do_remove_children(handlers, parent, child_index + 1, children);
  } else if (child instanceof UnsafeInnerHtml) {
    let attributes = child.attributes;
    let path2 = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path2, attributes);
  } else {
    return handlers;
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path2 = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children.hasLength(0)) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path2, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path2;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path2 = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path2, attributes);
    return do_add_children(_pipe$1, composed_mapper, path2, 0, children);
  } else if (child instanceof Fragment) {
    let children = child.children;
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let child_index$1 = child_index + 1;
    return do_add_children(
      handlers,
      composed_mapper,
      parent,
      child_index$1,
      children
    );
  } else if (child instanceof UnsafeInnerHtml) {
    let attributes = child.attributes;
    let path2 = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path2, attributes);
  } else {
    return handlers;
  }
}
function add_child(events, mapper, parent, index5, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index5, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path2, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path2,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function namespaced(namespace2, tag, attributes, children) {
  return element(
    "",
    identity2,
    namespace2,
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none2() {
  return text("", identity2, "");
}
function count_fragment_children(loop$children, loop$count) {
  while (true) {
    let children = loop$children;
    let count = loop$count;
    if (children.hasLength(0)) {
      return count;
    } else if (children.atLeastLength(1) && children.head instanceof Fragment) {
      let children_count = children.head.children_count;
      let rest = children.tail;
      loop$children = rest;
      loop$count = count + children_count;
    } else {
      let rest = children.tail;
      loop$children = rest;
      loop$count = count + 1;
    }
  }
}
function fragment2(children) {
  return fragment(
    "",
    identity2,
    children,
    empty2(),
    count_fragment_children(children, 0)
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function aside(attrs, children) {
  return element2("aside", attrs, children);
}
function h2(attrs, children) {
  return element2("h2", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function section(attrs, children) {
  return element2("section", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function li(attrs, children) {
  return element2("li", attrs, children);
}
function ul(attrs, children) {
  return element2("ul", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function br(attrs) {
  return element2("br", attrs, empty_list);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}
function option(attrs, label2) {
  return element2("option", attrs, toList([text2(label2)]));
}
function select(attrs, children) {
  return element2("select", attrs, children);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name2, data) {
    super();
    this.name = name2;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, attributes, properties, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.attributes = attributes;
    this.properties = properties;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init2 = new Config2(
    false,
    true,
    empty_dict(),
    empty_dict(),
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init2,
    (config, option2) => {
      return option2.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class _Spa {
  static start({ init: init2, update: update2, view }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root3 = selector instanceof HTMLElement ? selector : document2.querySelector(selector);
    if (!root3) return new Error(new ElementNotFound(selector));
    return new Ok(new _Spa(root3, init2(flags), update2, view));
  }
  #runtime;
  constructor(root3, [init2, effects], update2, view) {
    this.#runtime = new Runtime(root3, [init2, effects], view, update2);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = Spa.start;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init2, update2, view, config) {
    super();
    this.init = init2;
    this.update = update2;
    this.view = view;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init2, update2, view) {
  return new App(init2, update2, view, new$6(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/glam/glam/doc.mjs
var Line = class extends CustomType {
  constructor(size2) {
    super();
    this.size = size2;
  }
};
var Concat = class extends CustomType {
  constructor(docs) {
    super();
    this.docs = docs;
  }
};
var Text2 = class extends CustomType {
  constructor(text4, length4) {
    super();
    this.text = text4;
    this.length = length4;
  }
};
var Nest = class extends CustomType {
  constructor(doc, indentation2) {
    super();
    this.doc = doc;
    this.indentation = indentation2;
  }
};
var ForceBreak = class extends CustomType {
  constructor(doc) {
    super();
    this.doc = doc;
  }
};
var Break = class extends CustomType {
  constructor(unbroken, broken) {
    super();
    this.unbroken = unbroken;
    this.broken = broken;
  }
};
var FlexBreak = class extends CustomType {
  constructor(unbroken, broken) {
    super();
    this.unbroken = unbroken;
    this.broken = broken;
  }
};
var Group = class extends CustomType {
  constructor(doc) {
    super();
    this.doc = doc;
  }
};
var Broken = class extends CustomType {
};
var ForceBroken = class extends CustomType {
};
var Unbroken = class extends CustomType {
};
function break$(unbroken, broken) {
  return new Break(unbroken, broken);
}
function concat3(docs) {
  return new Concat(docs);
}
function from_string(string5) {
  return new Text2(string5, string_length(string5));
}
function zero_width_string(string5) {
  return new Text2(string5, 0);
}
function group(doc) {
  return new Group(doc);
}
function join2(docs, separator) {
  return concat3(intersperse(docs, separator));
}
function concat_join(docs, separators) {
  return join2(docs, concat3(separators));
}
function nest(doc, indentation2) {
  return new Nest(doc, indentation2);
}
function fits(loop$docs, loop$max_width, loop$current_width) {
  while (true) {
    let docs = loop$docs;
    let max_width2 = loop$max_width;
    let current_width = loop$current_width;
    if (current_width > max_width2) {
      return false;
    } else if (docs.hasLength(0)) {
      return true;
    } else {
      let indent = docs.head[0];
      let mode = docs.head[1];
      let doc = docs.head[2];
      let rest = docs.tail;
      if (doc instanceof Line) {
        return true;
      } else if (doc instanceof ForceBreak) {
        return false;
      } else if (doc instanceof Text2) {
        let length4 = doc.length;
        loop$docs = rest;
        loop$max_width = max_width2;
        loop$current_width = current_width + length4;
      } else if (doc instanceof Nest) {
        let doc$1 = doc.doc;
        let i = doc.indentation;
        let _pipe = prepend([indent + i, mode, doc$1], rest);
        loop$docs = _pipe;
        loop$max_width = max_width2;
        loop$current_width = current_width;
      } else if (doc instanceof Break) {
        let unbroken = doc.unbroken;
        if (mode instanceof Broken) {
          return true;
        } else if (mode instanceof ForceBroken) {
          return true;
        } else {
          loop$docs = rest;
          loop$max_width = max_width2;
          loop$current_width = current_width + string_length(unbroken);
        }
      } else if (doc instanceof FlexBreak) {
        let unbroken = doc.unbroken;
        if (mode instanceof Broken) {
          return true;
        } else if (mode instanceof ForceBroken) {
          return true;
        } else {
          loop$docs = rest;
          loop$max_width = max_width2;
          loop$current_width = current_width + string_length(unbroken);
        }
      } else if (doc instanceof Group) {
        let doc$1 = doc.doc;
        loop$docs = prepend([indent, mode, doc$1], rest);
        loop$max_width = max_width2;
        loop$current_width = current_width;
      } else {
        let docs$1 = doc.docs;
        let _pipe = map2(docs$1, (doc2) => {
          return [indent, mode, doc2];
        });
        let _pipe$1 = append(_pipe, rest);
        loop$docs = _pipe$1;
        loop$max_width = max_width2;
        loop$current_width = current_width;
      }
    }
  }
}
function indentation(size2) {
  return repeat(" ", size2);
}
function do_to_string2(loop$acc, loop$max_width, loop$current_width, loop$docs) {
  while (true) {
    let acc = loop$acc;
    let max_width2 = loop$max_width;
    let current_width = loop$current_width;
    let docs = loop$docs;
    if (docs.hasLength(0)) {
      return acc;
    } else {
      let indent = docs.head[0];
      let mode = docs.head[1];
      let doc = docs.head[2];
      let rest = docs.tail;
      if (doc instanceof Line) {
        let size2 = doc.size;
        let _pipe = acc + repeat("\n", size2) + indentation(indent);
        loop$acc = _pipe;
        loop$max_width = max_width2;
        loop$current_width = indent;
        loop$docs = rest;
      } else if (doc instanceof FlexBreak) {
        let unbroken = doc.unbroken;
        let broken = doc.broken;
        let new_unbroken_width = current_width + string_length(unbroken);
        let $ = fits(rest, max_width2, new_unbroken_width);
        if ($) {
          let _pipe = acc + unbroken;
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = new_unbroken_width;
          loop$docs = rest;
        } else {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        }
      } else if (doc instanceof Break) {
        let unbroken = doc.unbroken;
        let broken = doc.broken;
        if (mode instanceof Unbroken) {
          let new_width = current_width + string_length(unbroken);
          loop$acc = acc + unbroken;
          loop$max_width = max_width2;
          loop$current_width = new_width;
          loop$docs = rest;
        } else if (mode instanceof Broken) {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        } else {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        }
      } else if (doc instanceof ForceBreak) {
        let doc$1 = doc.doc;
        let docs$1 = prepend([indent, new ForceBroken(), doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else if (doc instanceof Concat) {
        let docs$1 = doc.docs;
        let _block;
        let _pipe = map2(docs$1, (doc2) => {
          return [indent, mode, doc2];
        });
        _block = append(_pipe, rest);
        let docs$2 = _block;
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$2;
      } else if (doc instanceof Group) {
        let doc$1 = doc.doc;
        let fits$1 = fits(
          toList([[indent, new Unbroken(), doc$1]]),
          max_width2,
          current_width
        );
        let _block;
        if (fits$1) {
          _block = new Unbroken();
        } else {
          _block = new Broken();
        }
        let new_mode = _block;
        let docs$1 = prepend([indent, new_mode, doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else if (doc instanceof Nest) {
        let doc$1 = doc.doc;
        let i = doc.indentation;
        let docs$1 = prepend([indent + i, mode, doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else {
        let text4 = doc.text;
        let length4 = doc.length;
        loop$acc = acc + text4;
        loop$max_width = max_width2;
        loop$current_width = current_width + length4;
        loop$docs = rest;
      }
    }
  }
}
function to_string5(doc, limit) {
  return do_to_string2("", limit, 0, toList([[0, new Unbroken(), doc]]));
}
var empty3 = /* @__PURE__ */ new Concat(/* @__PURE__ */ toList([]));
var flex_space = /* @__PURE__ */ new FlexBreak(" ", "");
var soft_break = /* @__PURE__ */ new Break("", "");
var space = /* @__PURE__ */ new Break(" ", "");

// build/dev/javascript/pprint/pprint_ffi.mjs
function decode_custom_type(value3) {
  if (value3 instanceof CustomType) {
    const name2 = value3.constructor.name;
    const fields = Object.keys(value3).map((label2) => {
      return isNaN(parseInt(label2)) ? new Labelled(label2, value3[label2]) : new Positional(value3[label2]);
    });
    return new Ok(new TCustom(name2, toList(fields)));
  }
  return new Error(void 0);
}
function decode_tuple7(value3) {
  if (Array.isArray(value3)) return new Ok(toList(value3));
  return new Error(void 0);
}
function decode_nil(value3) {
  if (value3 === void 0) return new Ok(void 0);
  return new Error(void 0);
}

// build/dev/javascript/pprint/pprint/decoder.mjs
var TString = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TInt = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TFloat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TBool = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TNil = class extends CustomType {
};
var TBitArray = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TDict = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TTuple = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TCustom = class extends CustomType {
  constructor(name2, fields) {
    super();
    this.name = name2;
    this.fields = fields;
  }
};
var TForeign = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Labelled = class extends CustomType {
  constructor(label2, value3) {
    super();
    this.label = label2;
    this.value = value3;
  }
};
var Positional = class extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
};
function custom_type() {
  return new_primitive_decoder(
    "CustomType",
    (dynamic2) => {
      return replace_error(
        decode_custom_type(dynamic2),
        new TCustom("", toList([]))
      );
    }
  );
}
function tuple() {
  return new_primitive_decoder(
    "Tuple",
    (dynamic2) => {
      return replace_error(decode_tuple7(dynamic2), toList([]));
    }
  );
}
function nil() {
  return new_primitive_decoder("Nil", decode_nil);
}
function type_decoder() {
  return recursive(
    () => {
      return one_of(
        map4(int2, (var0) => {
          return new TInt(var0);
        }),
        toList([
          map4(float2, (var0) => {
            return new TFloat(var0);
          }),
          map4(float2, (var0) => {
            return new TFloat(var0);
          }),
          map4(string2, (var0) => {
            return new TString(var0);
          }),
          map4(bool, (var0) => {
            return new TBool(var0);
          }),
          map4(nil(), (_) => {
            return new TNil();
          }),
          map4(
            bit_array2,
            (var0) => {
              return new TBitArray(var0);
            }
          ),
          custom_type(),
          map4(tuple(), (var0) => {
            return new TTuple(var0);
          }),
          map4(
            list2(dynamic),
            (var0) => {
              return new TList(var0);
            }
          ),
          map4(
            dict2(type_decoder(), type_decoder()),
            (var0) => {
              return new TDict(var0);
            }
          ),
          map4(
            dynamic,
            (value3) => {
              return new TForeign(inspect2(value3));
            }
          )
        ])
      );
    }
  );
}
function classify(value3) {
  let $ = run(value3, type_decoder());
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "pprint/decoder",
      31,
      "classify",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let t = $[0];
  return t;
}

// build/dev/javascript/pprint/pprint.mjs
var Config3 = class extends CustomType {
  constructor(style_mode, bit_array_mode, label_mode) {
    super();
    this.style_mode = style_mode;
    this.bit_array_mode = bit_array_mode;
    this.label_mode = label_mode;
  }
};
var Styled = class extends CustomType {
};
var Unstyled = class extends CustomType {
};
var KeepBitArrays = class extends CustomType {
};
var Labels = class extends CustomType {
};
var NoLabels = class extends CustomType {
};
function comma_list_space(docs, open, close, space2) {
  let _block;
  if (docs.hasLength(0)) {
    _block = empty3;
  } else {
    _block = break$("", ",");
  }
  let trailing = _block;
  let _pipe = toList([
    open,
    (() => {
      let _pipe2 = toList([
        soft_break,
        concat_join(docs, toList([from_string(","), space2]))
      ]);
      let _pipe$12 = concat3(_pipe2);
      return nest(_pipe$12, 2);
    })(),
    trailing,
    close
  ]);
  let _pipe$1 = concat3(_pipe);
  return group(_pipe$1);
}
function comma_list(docs, open, close) {
  return comma_list_space(docs, open, close, space);
}
var max_width = 40;
var reset = "\x1B[0m";
function ansi(text4, code, config) {
  let text_doc = from_string(text4);
  let $ = config.style_mode;
  if ($ instanceof Unstyled) {
    return text_doc;
  } else {
    return concat3(
      toList([
        zero_width_string(code),
        text_doc,
        zero_width_string(reset)
      ])
    );
  }
}
var green = "\x1B[38;5;2m";
function pretty_string(string5, config) {
  let _pipe = '"' + string5 + '"';
  return ansi(_pipe, green, config);
}
var yellow = "\x1B[38;5;3m";
var blue = "\x1B[38;5;4m";
var magenta = "\x1B[38;5;5m";
function pretty_bit_array(bits, config) {
  let _pipe = inspect2(bits);
  return ansi(_pipe, magenta, config);
}
var bold = "\x1B[1m";
var dim = "\x1B[2m";
function pretty_tuple(items, config) {
  let _pipe = map2(
    items,
    (_capture) => {
      return pretty_dynamic(_capture, config);
    }
  );
  return comma_list(_pipe, from_string("#("), from_string(")"));
}
function pretty_dynamic(value3, config) {
  let _pipe = value3;
  let _pipe$1 = classify(_pipe);
  return pretty_type(_pipe$1, config);
}
function pretty_type(value3, config) {
  if (value3 instanceof TString) {
    let s = value3[0];
    return pretty_string(s, config);
  } else if (value3 instanceof TInt) {
    let i = value3[0];
    let _pipe = to_string(i);
    return ansi(_pipe, yellow, config);
  } else if (value3 instanceof TFloat) {
    let f = value3[0];
    let _pipe = float_to_string(f);
    return ansi(_pipe, yellow, config);
  } else if (value3 instanceof TBool) {
    let b = value3[0];
    let _pipe = to_string2(b);
    return ansi(_pipe, blue, config);
  } else if (value3 instanceof TBitArray) {
    let b = value3[0];
    let $ = config.bit_array_mode;
    if ($ instanceof KeepBitArrays) {
      return pretty_bit_array(b, config);
    } else {
      let $1 = bit_array_to_string(b);
      if ($1.isOk()) {
        let s = $1[0];
        return pretty_string(s, config);
      } else {
        return pretty_bit_array(b, config);
      }
    }
  } else if (value3 instanceof TNil) {
    return ansi("Nil", blue, config);
  } else if (value3 instanceof TList) {
    let items = value3[0];
    return pretty_list(items, config);
  } else if (value3 instanceof TDict) {
    let d = value3[0];
    return pretty_dict(d, config);
  } else if (value3 instanceof TTuple) {
    let items = value3[0];
    return pretty_tuple(items, config);
  } else if (value3 instanceof TCustom) {
    let name2 = value3.name;
    let fields = value3.fields;
    return pretty_custom_type(name2, fields, config);
  } else {
    let f = value3[0];
    return ansi(f, dim, config);
  }
}
function with_config(value3, config) {
  let _pipe = value3;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = pretty_dynamic(_pipe$1, config);
  return to_string5(_pipe$2, max_width);
}
function debug(value3) {
  let _pipe = value3;
  let _pipe$1 = with_config(
    _pipe,
    new Config3(new Styled(), new KeepBitArrays(), new Labels())
  );
  console_error(_pipe$1);
  return value3;
}
function pretty_list(items, config) {
  let items$1 = map2(items, classify);
  let _block;
  if (items$1.atLeastLength(1) && items$1.head instanceof TInt) {
    _block = flex_space;
  } else if (items$1.atLeastLength(1) && items$1.head instanceof TFloat) {
    _block = flex_space;
  } else {
    _block = space;
  }
  let space2 = _block;
  let _pipe = map2(
    items$1,
    (_capture) => {
      return pretty_type(_capture, config);
    }
  );
  return comma_list_space(
    _pipe,
    from_string("["),
    from_string("]"),
    space2
  );
}
function pretty_dict(d, config) {
  let _pipe = map_to_list(d);
  let _pipe$1 = sort(
    _pipe,
    (one_field, other_field) => {
      let one_key = one_field[0];
      let other_key = other_field[0];
      return compare3(
        inspect2(one_key),
        inspect2(other_key)
      );
    }
  );
  let _pipe$2 = map2(
    _pipe$1,
    (field2) => {
      let _pipe$22 = toList([
        pretty_type(field2[0], config),
        pretty_type(field2[1], config)
      ]);
      return comma_list(_pipe$22, from_string("#("), from_string(")"));
    }
  );
  return comma_list(
    _pipe$2,
    from_string("dict.from_list(["),
    from_string("])")
  );
}
function pretty_custom_type(name2, fields, config) {
  let _block;
  if (name2 === "Ok") {
    _block = bold;
  } else if (name2 === "Error") {
    _block = bold;
  } else if (name2 === "Some") {
    _block = bold;
  } else if (name2 === "None") {
    _block = bold;
  } else {
    _block = "";
  }
  let style = _block;
  let fields$1 = map2(
    fields,
    (field2) => {
      let $ = config.label_mode;
      if (field2 instanceof Positional && $ instanceof Labels) {
        let value3 = field2.value;
        return pretty_dynamic(value3, config);
      } else if (field2 instanceof Positional && $ instanceof NoLabels) {
        let value3 = field2.value;
        return pretty_dynamic(value3, config);
      } else if (field2 instanceof Labelled && $ instanceof NoLabels) {
        let value3 = field2.value;
        return pretty_dynamic(value3, config);
      } else {
        let label2 = field2.label;
        let value3 = field2.value;
        return concat3(
          toList([
            ansi(label2 + ": ", dim, config),
            pretty_dynamic(value3, config)
          ])
        );
      }
    }
  );
  let name$1 = ansi(name2, style, config);
  let open = concat3(toList([name$1, from_string("(")]));
  let close = from_string(")");
  if (fields$1.hasLength(0)) {
    return name$1;
  } else if (fields$1.hasLength(1)) {
    let single = fields$1.head;
    return concat3(toList([open, single, close]));
  } else {
    let _pipe = fields$1;
    return comma_list(_pipe, open, close);
  }
}

// build/dev/javascript/eve_arbitrage/config/sde.mjs
var Location = class extends CustomType {
  constructor(name2, stations, system, region, contraband) {
    super();
    this.name = name2;
    this.stations = stations;
    this.system = system;
    this.region = region;
    this.contraband = contraband;
  }
};
var Ship = class extends CustomType {
  constructor(name2, holds) {
    super();
    this.name = name2;
    this.holds = holds;
  }
};
var Hold = class extends CustomType {
  constructor(name2, kind, capacity) {
    super();
    this.name = name2;
    this.kind = kind;
    this.capacity = capacity;
  }
};
var Generic = class extends CustomType {
};
var Infrastructure = class extends CustomType {
};
function hold_kind_to_string(hold_kind) {
  if (hold_kind instanceof Generic) {
    return "Generic";
  } else {
    return "Infrastructure";
  }
}
function get_all_hold_kinds() {
  return toList([new Generic(), new Infrastructure()]);
}
function hold_kind_from_string(hold_kind_string) {
  let $ = (() => {
    let _pipe = hold_kind_string;
    let _pipe$1 = lowercase(_pipe);
    return trim(_pipe$1);
  })();
  if ($ === "generic") {
    return new Ok(new Generic());
  } else if ($ === "infrastructure") {
    return new Ok(new Infrastructure());
  } else {
    return new Error(void 0);
  }
}
var jita_contraband = /* @__PURE__ */ toList([3713, 3721, 17796]);
var amarr_contraband = /* @__PURE__ */ toList([12478, 3727]);
var rens_contraband = /* @__PURE__ */ toList([]);
var hek_contraband = /* @__PURE__ */ toList([]);
var dodi_contraband = /* @__PURE__ */ toList([]);
var thera_contraband = /* @__PURE__ */ toList([]);
var locations = /* @__PURE__ */ toList([
  [
    "JITA",
    /* @__PURE__ */ new Location(
      "Jita",
      /* @__PURE__ */ toList([60003760]),
      30000142,
      10000002,
      jita_contraband
    )
  ],
  [
    "AMARR",
    /* @__PURE__ */ new Location(
      "Amarr",
      /* @__PURE__ */ toList([60008494]),
      30002187,
      10000043,
      amarr_contraband
    )
  ],
  [
    "RENS",
    /* @__PURE__ */ new Location(
      "Rens",
      /* @__PURE__ */ toList([60004588]),
      30002510,
      10000030,
      rens_contraband
    )
  ],
  [
    "HEK",
    /* @__PURE__ */ new Location(
      "Hek",
      /* @__PURE__ */ toList([60005686]),
      30002053,
      10000042,
      hek_contraband
    )
  ],
  [
    "DODI",
    /* @__PURE__ */ new Location(
      "Dodi",
      /* @__PURE__ */ toList([60003760]),
      30000142,
      10000032,
      dodi_contraband
    )
  ],
  [
    "THERA",
    /* @__PURE__ */ new Location(
      "Thera",
      /* @__PURE__ */ toList([60015148, 60015149, 60015150, 60015151]),
      31000005,
      11000031,
      thera_contraband
    )
  ]
]);

// build/dev/javascript/eve_arbitrage/config/esi.mjs
var Order = class extends CustomType {
  constructor(duration, issued, location_id, min_volume, order_id, price, range, system_id, type_id, volume_remain, volume_total) {
    super();
    this.duration = duration;
    this.issued = issued;
    this.location_id = location_id;
    this.min_volume = min_volume;
    this.order_id = order_id;
    this.price = price;
    this.range = range;
    this.system_id = system_id;
    this.type_id = type_id;
    this.volume_remain = volume_remain;
    this.volume_total = volume_total;
  }
};
var Type = class extends CustomType {
  constructor(type_id, volume, name2) {
    super();
    this.type_id = type_id;
    this.volume = volume;
    this.name = name2;
  }
};
function merge_orders(order_1, order_2) {
  let can_merge = order_1.location_id === order_2.location_id && order_1.price === order_2.price && order_1.type_id === order_2.type_id && order_1.system_id === order_2.system_id;
  if (!can_merge) {
    return new Error(void 0);
  } else {
    return new Ok(
      (() => {
        let _record = order_1;
        return new Order(
          _record.duration,
          _record.issued,
          _record.location_id,
          _record.min_volume,
          _record.order_id,
          _record.price,
          _record.range,
          _record.system_id,
          _record.type_id,
          order_1.volume_remain + order_2.volume_remain,
          order_1.volume_total + order_2.volume_total
        );
      })()
    );
  }
}
function drain_order(order, amount) {
  let _record = order;
  return new Order(
    _record.duration,
    _record.issued,
    _record.location_id,
    _record.min_volume,
    _record.order_id,
    _record.price,
    _record.range,
    _record.system_id,
    _record.type_id,
    order.volume_remain - amount,
    _record.volume_total
  );
}
function buy_order_decoder() {
  return field(
    "duration",
    int2,
    (duration) => {
      return field(
        "is_buy_order",
        bool,
        (is_buy_order) => {
          return lazy_guard(
            !is_buy_order,
            () => {
              throw makeError(
                "panic",
                "config/esi",
                100,
                "",
                "found a sell order, should be a buy order",
                {}
              );
            },
            () => {
              return field(
                "issued",
                string2,
                (issued) => {
                  return field(
                    "location_id",
                    int2,
                    (location_id) => {
                      return field(
                        "min_volume",
                        int2,
                        (min_volume) => {
                          return field(
                            "order_id",
                            int2,
                            (order_id) => {
                              return field(
                                "price",
                                float2,
                                (price) => {
                                  return field(
                                    "range",
                                    string2,
                                    (range) => {
                                      return field(
                                        "system_id",
                                        int2,
                                        (system_id) => {
                                          return field(
                                            "type_id",
                                            int2,
                                            (type_id) => {
                                              return field(
                                                "volume_remain",
                                                int2,
                                                (volume_remain) => {
                                                  return field(
                                                    "volume_total",
                                                    int2,
                                                    (volume_total) => {
                                                      return success(
                                                        new Order(
                                                          duration,
                                                          issued,
                                                          location_id,
                                                          min_volume,
                                                          order_id,
                                                          price,
                                                          range,
                                                          system_id,
                                                          type_id,
                                                          volume_remain,
                                                          volume_total
                                                        )
                                                      );
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function buy_orders_decoder() {
  return list2(buy_order_decoder());
}
function sell_order_decoder() {
  return field(
    "duration",
    int2,
    (duration) => {
      return field(
        "is_buy_order",
        bool,
        (is_buy_order) => {
          return lazy_guard(
            is_buy_order,
            () => {
              throw makeError(
                "panic",
                "config/esi",
                131,
                "",
                "found a buy order, should be a sell order",
                {}
              );
            },
            () => {
              return field(
                "issued",
                string2,
                (issued) => {
                  return field(
                    "location_id",
                    int2,
                    (location_id) => {
                      return field(
                        "min_volume",
                        int2,
                        (min_volume) => {
                          return field(
                            "order_id",
                            int2,
                            (order_id) => {
                              return field(
                                "price",
                                float2,
                                (price) => {
                                  return field(
                                    "range",
                                    string2,
                                    (range) => {
                                      return field(
                                        "system_id",
                                        int2,
                                        (system_id) => {
                                          return field(
                                            "type_id",
                                            int2,
                                            (type_id) => {
                                              return field(
                                                "volume_remain",
                                                int2,
                                                (volume_remain) => {
                                                  return field(
                                                    "volume_total",
                                                    int2,
                                                    (volume_total) => {
                                                      return success(
                                                        new Order(
                                                          duration,
                                                          issued,
                                                          location_id,
                                                          min_volume,
                                                          order_id,
                                                          price,
                                                          range,
                                                          system_id,
                                                          type_id,
                                                          volume_remain,
                                                          volume_total
                                                        )
                                                      );
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function sell_orders_decoder() {
  return list2(sell_order_decoder());
}
function type_decoder2() {
  return field(
    "type_id",
    int2,
    (type_id) => {
      return field(
        "volume",
        float2,
        (volume) => {
          return field(
            "name",
            string2,
            (name2) => {
              return success(new Type(type_id, volume, name2));
            }
          );
        }
      );
    }
  );
}
var esi_url = "https://esi.evetech.net/latest";
var market_order_url = "/markets/{region_id}/orders/?datasource=tranquility&order_type={order_kind}&page={page}";
function get_market_orders_url(from2, is_buy_order, page) {
  let _block;
  if (!is_buy_order) {
    _block = "sell";
  } else {
    _block = "buy";
  }
  let order_kind = _block;
  let _pipe = toList([esi_url, market_order_url]);
  let _pipe$1 = concat2(_pipe);
  let _pipe$2 = replace(
    _pipe$1,
    "{region_id}",
    to_string(from2.region)
  );
  let _pipe$3 = replace(_pipe$2, "{order_kind}", order_kind);
  return replace(
    _pipe$3,
    "{page}",
    (() => {
      let _pipe$4 = page;
      return to_string(_pipe$4);
    })()
  );
}
var type_id_metadata_url = "/universe/types/{type_id}?datasource=tranquility";
function get_type_id_metadata_url(type_id) {
  return esi_url + (() => {
    let _pipe = type_id_metadata_url;
    return replace(
      _pipe,
      "{type_id}",
      (() => {
        let _pipe$1 = type_id;
        return to_string(_pipe$1);
      })()
    );
  })();
}

// build/dev/javascript/eve_arbitrage/util/numbers.mjs
function int_to_segments(loop$acc, loop$from) {
  while (true) {
    let acc = loop$acc;
    let from2 = loop$from;
    let $ = divideInt(from2, 1e3);
    if ($ > 0) {
      let x = $;
      let segment = "," + (() => {
        let _pipe = to_string(remainderInt(from2, 1e3));
        return pad_start(_pipe, 3, "0");
      })();
      loop$acc = prepend(segment, acc);
      loop$from = x;
    } else {
      let _pipe = prepend(
        (() => {
          let _pipe2 = from2;
          return to_string(_pipe2);
        })(),
        acc
      );
      return reverse(_pipe);
    }
  }
}
function float_to_human_string(from2) {
  let truncated = truncate(from2);
  let _pipe = int_to_segments(toList([]), truncated);
  let _pipe$1 = reverse(_pipe);
  return concat2(_pipe$1);
}
function millions_to_unit_string(from2) {
  let thousands = int_to_segments(toList([]), from2);
  let _block;
  if (thousands.hasLength(0)) {
    throw makeError(
      "panic",
      "util/numbers",
      42,
      "millions_to_unit_string",
      "shouldnt be able to find an empty value",
      {}
    );
  } else if (thousands.hasLength(1)) {
    let v = thousands.head;
    _block = [v, "M"];
  } else {
    let v = thousands.tail;
    _block = [
      (() => {
        let _pipe = v;
        let _pipe$1 = reverse(_pipe);
        return concat2(_pipe$1);
      })(),
      "B"
    ];
  }
  let $ = _block;
  let value3 = $[0];
  let units = $[1];
  return value3 + " " + units;
}
function ints_to_string(from2) {
  let _pipe = map2(
    from2,
    (value3) => {
      return (() => {
        let _pipe2 = value3;
        return to_string(_pipe2);
      })() + ",";
    }
  );
  return concat2(_pipe);
}
function string_to_ints(from2) {
  let _pipe = from2;
  let _pipe$1 = drop_end(_pipe, 1);
  let _pipe$2 = split2(_pipe$1, ",");
  let _pipe$3 = map2(_pipe$2, parse_int);
  return all2(_pipe$3);
}
function ints_dict_to_string(from2) {
  return fold2(
    from2,
    "",
    (acc, index5, ints) => {
      return acc + (() => {
        let _pipe = index5;
        return to_string(_pipe);
      })() + ":" + (() => {
        let _pipe = ints;
        return ints_to_string(_pipe);
      })() + ";";
    }
  );
}
function string_to_ints_dict(from2) {
  return guard(
    is_empty2(from2),
    new Ok(from_list(toList([]))),
    () => {
      let _block;
      let _pipe = from2;
      let _pipe$1 = drop_end(_pipe, 1);
      _block = split2(_pipe$1, ";");
      let sections = _block;
      let _pipe$2 = map2(
        sections,
        (section2) => {
          let $ = split2(section2, ":");
          if (!$.hasLength(2)) {
            throw makeError(
              "let_assert",
              "util/numbers",
              79,
              "",
              "Pattern match failed, no pattern matched the value.",
              { value: $ }
            );
          }
          let index_string = $.head;
          let int_list_string = $.tail.head;
          return try$(
            parse_int(index_string),
            (index5) => {
              return guard(
                is_empty2(int_list_string),
                new Ok([index5, toList([])]),
                () => {
                  return map3(
                    string_to_ints(int_list_string),
                    (int_list) => {
                      return [index5, int_list];
                    }
                  );
                }
              );
            }
          );
        }
      );
      let _pipe$3 = all2(_pipe$2);
      return map3(_pipe$3, from_list);
    }
  );
}
function int_to_human_string(from2) {
  let $ = divideInt(from2, 1e3);
  if ($ > 10) {
    let thousands = $;
    return to_string(thousands) + "k";
  } else {
    return to_string(from2);
  }
}

// build/dev/javascript/eve_arbitrage/arbitrage.mjs
var Item = class extends CustomType {
  constructor(id2, name2, m3) {
    super();
    this.id = id2;
    this.name = name2;
    this.m3 = m3;
  }
};
var Trade = class extends CustomType {
  constructor(source, destination, item, amount, total_volume, unit_buy_price, unit_sell_price, total_price, profit_per_volume) {
    super();
    this.source = source;
    this.destination = destination;
    this.item = item;
    this.amount = amount;
    this.total_volume = total_volume;
    this.unit_buy_price = unit_buy_price;
    this.unit_sell_price = unit_sell_price;
    this.total_price = total_price;
    this.profit_per_volume = profit_per_volume;
  }
};
var RawTrade = class extends CustomType {
  constructor(source, destination, item, amount, unit_buy_price, unit_sell_price, unit_profit) {
    super();
    this.source = source;
    this.destination = destination;
    this.item = item;
    this.amount = amount;
    this.unit_buy_price = unit_buy_price;
    this.unit_sell_price = unit_sell_price;
    this.unit_profit = unit_profit;
  }
};
var Multibuy = class extends CustomType {
  constructor(purchases, total_price, total_profit) {
    super();
    this.purchases = purchases;
    this.total_price = total_price;
    this.total_profit = total_profit;
  }
};
var Purchase = class extends CustomType {
  constructor(item_name, amount, unit_price, total_price, total_profit) {
    super();
    this.item_name = item_name;
    this.amount = amount;
    this.unit_price = unit_price;
    this.total_price = total_price;
    this.total_profit = total_profit;
  }
};
function pick_trades_for_hold(hold, collateral, trades) {
  let capacity = hold.capacity;
  let $ = fold(
    trades,
    [toList([]), toList([]), collateral, capacity],
    (_use0, current_trade) => {
      let selected_trades2 = _use0[0];
      let leftover_trades2 = _use0[1];
      let remaining_collateral2 = _use0[2];
      let remaining_capacity = _use0[3];
      let $1 = current_trade.total_volume <= remaining_capacity && current_trade.total_price <= remaining_collateral2;
      if (!$1) {
        return [
          selected_trades2,
          prepend(current_trade, leftover_trades2),
          remaining_collateral2,
          remaining_capacity
        ];
      } else {
        return [
          prepend(current_trade, selected_trades2),
          leftover_trades2,
          remaining_collateral2 - current_trade.total_price,
          remaining_capacity - current_trade.total_volume
        ];
      }
    }
  );
  let selected_trades = $[0];
  let leftover_trades = $[1];
  let remaining_collateral = $[2];
  return [selected_trades, leftover_trades, remaining_collateral];
}
function trade_to_purchase(trade) {
  return new Purchase(
    trade.item.name,
    trade.amount,
    trade.unit_sell_price,
    trade.unit_sell_price * (() => {
      let _pipe = trade.amount;
      return identity(_pipe);
    })(),
    (trade.unit_buy_price - trade.unit_sell_price) * (() => {
      let _pipe = trade.amount;
      return identity(_pipe);
    })()
  );
}
function raw_trade_to_trade(raw_trade, type_2) {
  let $ = raw_trade.item === type_2.type_id;
  if (!$) {
    return new Error(void 0);
  } else {
    let _pipe = new Trade(
      raw_trade.source,
      raw_trade.destination,
      new Item(type_2.type_id, type_2.name, type_2.volume),
      raw_trade.amount,
      (() => {
        let _pipe2 = raw_trade.amount;
        return identity(_pipe2);
      })() * type_2.volume,
      raw_trade.unit_buy_price,
      raw_trade.unit_sell_price,
      raw_trade.unit_sell_price * (() => {
        let _pipe2 = raw_trade.amount;
        return identity(_pipe2);
      })(),
      divideFloat(raw_trade.unit_profit, type_2.volume)
    );
    return new Ok(_pipe);
  }
}
function merge_orders2(orders) {
  let r = fold(
    orders,
    new_map(),
    (acc, order) => {
      let _block;
      let $ = map_get(acc, order.type_id);
      if (!$.isOk()) {
        _block = toList([order]);
      } else {
        let list4 = $[0];
        _block = prepend(order, list4);
      }
      let current_item_orders_list = _block;
      return insert(acc, order.type_id, current_item_orders_list);
    }
  );
  return map_values(
    r,
    (_, orders2) => {
      let ordered_orders = sort(
        orders2,
        (order_1, order_2) => {
          return compare(order_1.price, order_2.price);
        }
      );
      return fold(
        ordered_orders,
        toList([]),
        (new_orders, order) => {
          return guard(
            is_empty(new_orders),
            toList([order]),
            () => {
              if (!new_orders.atLeastLength(1)) {
                throw makeError(
                  "let_assert",
                  "arbitrage",
                  216,
                  "",
                  "Pattern match failed, no pattern matched the value.",
                  { value: new_orders }
                );
              }
              let top = new_orders.head;
              let rest = new_orders.tail;
              let $ = merge_orders(top, order);
              if (!$.isOk()) {
                return prepend(order, prepend(top, rest));
              } else {
                let merged_order = $[0];
                return prepend(merged_order, rest);
              }
            }
          );
        }
      );
    }
  );
}
function recurse_compute_trades_from_item_orders(sell_orders, buy_orders, acc) {
  return guard(
    is_empty(sell_orders) || is_empty(buy_orders),
    acc,
    () => {
      if (!sell_orders.atLeastLength(1)) {
        throw makeError(
          "let_assert",
          "arbitrage",
          275,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: sell_orders }
        );
      }
      let top_sell_order = sell_orders.head;
      let rest_sell_orders = sell_orders.tail;
      if (!buy_orders.atLeastLength(1)) {
        throw makeError(
          "let_assert",
          "arbitrage",
          276,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: buy_orders }
        );
      }
      let top_buy_order = buy_orders.head;
      let rest_buy_orders = buy_orders.tail;
      let $ = compare2(
        top_sell_order.volume_remain,
        top_buy_order.volume_remain
      );
      if ($ instanceof Eq) {
        let trade = new RawTrade(
          top_sell_order.location_id,
          top_buy_order.location_id,
          top_sell_order.type_id,
          top_sell_order.volume_remain,
          top_buy_order.price,
          top_sell_order.price,
          top_buy_order.price - top_sell_order.price
        );
        return recurse_compute_trades_from_item_orders(
          rest_sell_orders,
          rest_buy_orders,
          prepend(trade, acc)
        );
      } else if ($ instanceof Gt) {
        let trade = new RawTrade(
          top_sell_order.location_id,
          top_buy_order.location_id,
          top_sell_order.type_id,
          top_buy_order.volume_remain,
          top_buy_order.price,
          top_sell_order.price,
          top_buy_order.price - top_sell_order.price
        );
        let remaining_top_sell_order = drain_order(
          top_sell_order,
          top_buy_order.volume_remain
        );
        return recurse_compute_trades_from_item_orders(
          prepend(remaining_top_sell_order, rest_sell_orders),
          rest_buy_orders,
          prepend(trade, acc)
        );
      } else {
        let trade = new RawTrade(
          top_sell_order.location_id,
          top_buy_order.location_id,
          top_sell_order.type_id,
          top_sell_order.volume_remain,
          top_buy_order.price,
          top_sell_order.price,
          top_buy_order.price - top_sell_order.price
        );
        let remaining_top_buy_order = drain_order(
          top_buy_order,
          top_sell_order.volume_remain
        );
        return recurse_compute_trades_from_item_orders(
          rest_sell_orders,
          prepend(remaining_top_buy_order, rest_buy_orders),
          prepend(trade, acc)
        );
      }
    }
  );
}
function compute_trades(sell_orders, buy_orders, tax_rate) {
  let sell_orders$1 = merge_orders2(sell_orders);
  let buy_orders$1 = merge_orders2(buy_orders);
  let sell_orders_items = keys(sell_orders$1);
  let buy_orders_items = keys(buy_orders$1);
  let tradeable_items = filter(
    sell_orders_items,
    (_capture) => {
      return contains(buy_orders_items, _capture);
    }
  );
  let _pipe = map2(
    tradeable_items,
    (item) => {
      let $ = map_get(sell_orders$1, item);
      if (!$.isOk()) {
        throw makeError(
          "let_assert",
          "arbitrage",
          238,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let item_sell_orders = $[0];
      let $1 = map_get(buy_orders$1, item);
      if (!$1.isOk()) {
        throw makeError(
          "let_assert",
          "arbitrage",
          239,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $1 }
        );
      }
      let item_buy_orders = $1[0];
      let sorted_item_sell_orders = sort(
        item_sell_orders,
        (order_1, order_2) => {
          return compare(order_1.price, order_2.price);
        }
      );
      let sorted_item_buy_orders = sort(
        item_buy_orders,
        (order_1, order_2) => {
          return compare(order_2.price, order_1.price);
        }
      );
      return recurse_compute_trades_from_item_orders(
        sorted_item_sell_orders,
        sorted_item_buy_orders,
        toList([])
      );
    }
  );
  let _pipe$1 = flatten(_pipe);
  let _pipe$2 = map2(
    _pipe$1,
    (raw_trade) => {
      let buy_price_with_taxes = raw_trade.unit_buy_price * tax_rate;
      let _record = raw_trade;
      return new RawTrade(
        _record.source,
        _record.destination,
        _record.item,
        _record.amount,
        buy_price_with_taxes,
        _record.unit_sell_price,
        buy_price_with_taxes - raw_trade.unit_sell_price
      );
    }
  );
  return filter(
    _pipe$2,
    (raw_trade) => {
      return raw_trade.unit_profit > 0;
    }
  );
}
function multibuy_from_purchases(purchases) {
  let $ = fold(
    purchases,
    [0, 0],
    (input2, purchase) => {
      let price = input2[0];
      let profit = input2[1];
      return [price + purchase.total_price, profit + purchase.total_profit];
    }
  );
  let total_price = $[0];
  let total_profit = $[1];
  return new Multibuy(purchases, total_price, total_profit);
}
function selected_trades_to_multibuys(from2) {
  let _pipe = fold(
    from2,
    new_map(),
    (split_trades, current_trade) => {
      return upsert(
        split_trades,
        current_trade.item,
        (optional_found_trades) => {
          let _pipe2 = unwrap(optional_found_trades, toList([]));
          return prepend2(_pipe2, current_trade);
        }
      );
    }
  );
  let _pipe$1 = values(_pipe);
  let _pipe$2 = sort(
    _pipe$1,
    (trades_1, trades_2) => {
      return compare2(
        (() => {
          let _pipe$22 = trades_2;
          return length(_pipe$22);
        })(),
        (() => {
          let _pipe$22 = trades_1;
          return length(_pipe$22);
        })()
      );
    }
  );
  let _pipe$3 = transpose(_pipe$2);
  let _pipe$4 = debug(_pipe$3);
  let _pipe$5 = map2(
    _pipe$4,
    (list_of_trades) => {
      let _pipe$52 = list_of_trades;
      return map2(_pipe$52, trade_to_purchase);
    }
  );
  return map2(_pipe$5, multibuy_from_purchases);
}
function trades_to_multibuys(trades, collateral, holds) {
  let sorted_trades = sort(
    trades,
    (trade_1, trade_2) => {
      return compare(
        trade_2.profit_per_volume,
        trade_1.profit_per_volume
      );
    }
  );
  let _block;
  let _pipe = collateral * 1e6;
  _block = identity(_pipe);
  let collateral$1 = _block;
  let $ = fold(
    holds,
    [toList([]), sorted_trades, collateral$1],
    (input2, hold) => {
      let old_selected_trades = input2[0];
      let leftover_trades = input2[1];
      let remaining_collateral = input2[2];
      let $1 = pick_trades_for_hold(hold, remaining_collateral, leftover_trades);
      let new_selected_trades = $1[0];
      let leftover_trades$1 = $1[1];
      let remaining_collateral$1 = $1[2];
      let current_selected_trades = append(
        new_selected_trades,
        old_selected_trades
      );
      return [
        current_selected_trades,
        leftover_trades$1,
        remaining_collateral$1
      ];
    }
  );
  let selected_trades = $[0];
  return selected_trades_to_multibuys(selected_trades);
}
function get_multibuy_purchases(multibuy) {
  return multibuy.purchases;
}
function get_multibuy_total_price(multibuy) {
  return multibuy.total_price;
}
function purchase_to_string(purchase) {
  return purchase.item_name + "	" + to_string(purchase.amount) + "	" + float_to_string(
    purchase.unit_price
  ) + "	" + float_to_string(purchase.total_price);
}
function multibuy_to_string(multibuy) {
  let _pipe = map2(
    multibuy.purchases,
    (purchase) => {
      return purchase_to_string(purchase) + "\n";
    }
  );
  let _pipe$1 = concat2(_pipe);
  return drop_end(_pipe$1, 1);
}
var base_tax_rate = 7.5;
var tax_reduction_per_accounting_level = 11;
function tax_percent_from_accounting_level(accounting_level) {
  let accounting_tax_percent_reduction = (() => {
    let _pipe = accounting_level;
    return identity(_pipe);
  })() * tax_reduction_per_accounting_level;
  let remaining_tax_ratio = 1 - divideFloat(
    accounting_tax_percent_reduction,
    100
  );
  let effective_tax_rate = base_tax_rate * remaining_tax_ratio;
  return effective_tax_rate;
}

// build/dev/javascript/gleam_time/gleam_time_ffi.mjs
function system_time() {
  const now = Date.now();
  const milliseconds = now % 1e3;
  const nanoseconds2 = milliseconds * 1e6;
  const seconds2 = (now - milliseconds) / 1e3;
  return [seconds2, nanoseconds2];
}

// build/dev/javascript/gleam_time/gleam/time/timestamp.mjs
var Timestamp = class extends CustomType {
  constructor(seconds2, nanoseconds2) {
    super();
    this.seconds = seconds2;
    this.nanoseconds = nanoseconds2;
  }
};
function normalise(timestamp) {
  let multiplier = 1e9;
  let nanoseconds2 = remainderInt(timestamp.nanoseconds, multiplier);
  let overflow = timestamp.nanoseconds - nanoseconds2;
  let seconds2 = timestamp.seconds + divideInt(overflow, multiplier);
  let $ = nanoseconds2 >= 0;
  if ($) {
    return new Timestamp(seconds2, nanoseconds2);
  } else {
    return new Timestamp(seconds2 - 1, multiplier + nanoseconds2);
  }
}
function system_time2() {
  let $ = system_time();
  let seconds2 = $[0];
  let nanoseconds2 = $[1];
  return normalise(new Timestamp(seconds2, nanoseconds2));
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path2, query, fragment3) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
    this.fragment = fragment3;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("#") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let query = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        new Some(query),
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path2,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path2,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_port(rest, pieces);
    } else if (uri_string.startsWith("]")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2 + 1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size2 === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size2 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let _block;
    let _record = pieces;
    _block = new Uri(
      _record.scheme,
      _record.userinfo,
      new Some(""),
      _record.port,
      _record.path,
      _record.query,
      _record.fragment
    );
    let pieces$1 = _block;
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("@") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_host(rest, pieces);
    } else if (uri_string.startsWith("@")) {
      let rest = uri_string.slice(1);
      let userinfo = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        new Some(userinfo),
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_host(rest, pieces$1);
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_authority_pieces(string5, pieces) {
  return parse_userinfo_loop(string5, string5, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("/") && size2 === 0) {
      return parse_authority_with_slashes(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let scheme = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size2 === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_authority_with_slashes(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function to_string6(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment3 = $[0];
    _block = toList(["#", fragment3]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if ($2 instanceof Some && !$3 && $2[0] !== "") {
    let host = $2[0];
    _block$2 = prepend("/", parts$2);
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($4 instanceof Some && $5 instanceof Some) {
    let port = $5[0];
    _block$3 = prepend(":", prepend(to_string(port), parts$3));
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($6 instanceof Some && $7 instanceof Some && $8 instanceof Some) {
    let s = $6[0];
    let u = $7[0];
    let h = $8[0];
    _block$4 = prepend(
      s,
      prepend(
        "://",
        prepend(u, prepend("@", prepend(h, parts$4)))
      )
    );
  } else if ($6 instanceof Some && $7 instanceof None && $8 instanceof Some) {
    let s = $6[0];
    let h = $8[0];
    _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
  } else if ($6 instanceof Some && $7 instanceof Some && $8 instanceof None) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else if ($6 instanceof Some && $7 instanceof None && $8 instanceof None) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else if ($6 instanceof None && $7 instanceof None && $8 instanceof Some) {
    let h = $8[0];
    _block$4 = prepend("//", prepend(h, parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
var empty5 = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty5, 0);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch2 = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch2) {
    return "PATCH";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path2, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};
function get_header(response, key) {
  return key_find(response.headers, lowercase(key));
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value3) {
    return value3 instanceof Promise ? new _PromiseLayer(value3) : value3;
  }
  static unwrap(value3) {
    return value3 instanceof _PromiseLayer ? value3.promise : value3;
  }
};
function resolve(value3) {
  return Promise.resolve(PromiseLayer.wrap(value3));
}
function then_await(promise, fn) {
  return promise.then((value3) => fn(PromiseLayer.unwrap(value3)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value3) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value3)))
  );
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a2) => {
      callback(a2);
      return a2;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string6(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD") options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList) headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send2(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/rsvp/rsvp.ffi.mjs
var from_relative_url = (url_string) => {
  if (!globalThis.location) return new Error(void 0);
  const url = new URL(url_string, globalThis.location.href);
  const uri = uri_from_url(url);
  return new Ok(uri);
};
var uri_from_url = (url) => {
  const optional = (value3) => value3 ? new Some(value3) : new None();
  return new Uri(
    /* scheme   */
    optional(url.protocol?.slice(0, -1)),
    /* userinfo */
    new None(),
    /* host     */
    optional(url.hostname),
    /* port     */
    optional(url.port && Number(url.port)),
    /* path     */
    url.pathname,
    /* query    */
    optional(url.search?.slice(1)),
    /* fragment */
    optional(url.hash?.slice(1))
  );
};

// build/dev/javascript/rsvp/rsvp.mjs
var BadBody = class extends CustomType {
};
var BadUrl = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var HttpError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var JsonError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NetworkError2 = class extends CustomType {
};
var UnhandledResponse = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Handler = class extends CustomType {
  constructor(run4) {
    super();
    this.run = run4;
  }
};
function expect_ok_response(handler) {
  return new Handler(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = response.status;
            if ($ >= 200 && $ < 300) {
              let code = $;
              return new Ok(response);
            } else if ($ >= 400 && $ < 600) {
              let code = $;
              return new Error(new HttpError(response));
            } else {
              return new Error(new UnhandledResponse(response));
            }
          }
        )
      );
    }
  );
}
function expect_json_response(handler) {
  return expect_ok_response(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = get_header(response, "content-type");
            if ($.isOk() && $[0] === "application/json") {
              return new Ok(response);
            } else if ($.isOk() && $[0].startsWith("application/json;")) {
              return new Ok(response);
            } else {
              return new Error(new UnhandledResponse(response));
            }
          }
        )
      );
    }
  );
}
function do_send(request, handler) {
  return from(
    (dispatch) => {
      let _pipe = send2(request);
      let _pipe$1 = try_await(_pipe, read_text_body);
      let _pipe$2 = map_promise(
        _pipe$1,
        (_capture) => {
          return map_error(
            _capture,
            (error) => {
              if (error instanceof NetworkError) {
                return new NetworkError2();
              } else if (error instanceof UnableToReadBody) {
                return new BadBody();
              } else {
                return new BadBody();
              }
            }
          );
        }
      );
      let _pipe$3 = map_promise(_pipe$2, handler.run);
      tap(_pipe$3, dispatch);
      return void 0;
    }
  );
}
function send3(request, handler) {
  return do_send(request, handler);
}
function reject(err, handler) {
  return from(
    (dispatch) => {
      let _pipe = new Error(err);
      let _pipe$1 = handler.run(_pipe);
      return dispatch(_pipe$1);
    }
  );
}
function decode_json_body(response, decoder) {
  let _pipe = response.body;
  let _pipe$1 = parse(_pipe, decoder);
  return map_error(_pipe$1, (var0) => {
    return new JsonError(var0);
  });
}
function expect_json(decoder, handler) {
  return expect_json_response(
    (result) => {
      let _pipe = result;
      let _pipe$1 = then$(
        _pipe,
        (_capture) => {
          return decode_json_body(_capture, decoder);
        }
      );
      return handler(_pipe$1);
    }
  );
}
function to_uri2(uri_string) {
  let _block;
  if (uri_string.startsWith("./")) {
    _block = from_relative_url(uri_string);
  } else if (uri_string.startsWith("/")) {
    _block = from_relative_url(uri_string);
  } else {
    _block = parse2(uri_string);
  }
  let _pipe = _block;
  return replace_error(_pipe, new BadUrl(uri_string));
}
function get2(url, handler) {
  let $ = to_uri2(url);
  if ($.isOk()) {
    let uri = $[0];
    let _pipe = from_uri(uri);
    let _pipe$1 = map3(
      _pipe,
      (_capture) => {
        return send3(_capture, handler);
      }
    );
    let _pipe$2 = map_error(
      _pipe$1,
      (_) => {
        return reject(new BadUrl(url), handler);
      }
    );
    return unwrap_both(_pipe$2);
  } else {
    let err = $[0];
    return reject(err, handler);
  }
}

// build/dev/javascript/eve_arbitrage/storage_ffi.mjs
function localStorage() {
  try {
    if (globalThis.Storage && globalThis.localStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}
function removeManyItems(storage, pattern) {
  const regex = new RegExp(pattern.replace(/\*/g, ".*"));
  const keysToDelete = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (regex.test(key)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => storage.removeItem(key));
  return;
}

// build/dev/javascript/eve_arbitrage/mvu.mjs
var Model = class extends CustomType {
  constructor(storage, ships, current_ship, count_ship_index, count_hold_index, systems, source, destination, accounting_level, language, sidebar_expanded, collateral, trades) {
    super();
    this.storage = storage;
    this.ships = ships;
    this.current_ship = current_ship;
    this.count_ship_index = count_ship_index;
    this.count_hold_index = count_hold_index;
    this.systems = systems;
    this.source = source;
    this.destination = destination;
    this.accounting_level = accounting_level;
    this.language = language;
    this.sidebar_expanded = sidebar_expanded;
    this.collateral = collateral;
    this.trades = trades;
  }
};
var RawTrade2 = class extends CustomType {
  constructor(raw_trade) {
    super();
    this.raw_trade = raw_trade;
  }
};
var Trade2 = class extends CustomType {
  constructor(trade) {
    super();
    this.trade = trade;
  }
};
var Multibuy2 = class extends CustomType {
  constructor(multibuy) {
    super();
    this.multibuy = multibuy;
  }
};
var ShipEntry = class extends CustomType {
  constructor(ship, is_expanded) {
    super();
    this.ship = ship;
    this.is_expanded = is_expanded;
  }
};
var Empty2 = class extends CustomType {
};
var Loading = class extends CustomType {
};
var Loaded = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var System = class extends CustomType {
  constructor(location, buy_orders, buy_orders_status, sell_orders, sell_orders_status) {
    super();
    this.location = location;
    this.buy_orders = buy_orders;
    this.buy_orders_status = buy_orders_status;
    this.sell_orders = sell_orders;
    this.sell_orders_status = sell_orders_status;
  }
};
var UserSelectedSource = class extends CustomType {
  constructor(new_source) {
    super();
    this.new_source = new_source;
  }
};
var UserSelectedDestination = class extends CustomType {
  constructor(new_destination) {
    super();
    this.new_destination = new_destination;
  }
};
var UserLoadedSource = class extends CustomType {
  constructor(source) {
    super();
    this.source = source;
  }
};
var UserLoadedDestination = class extends CustomType {
  constructor(destination) {
    super();
    this.destination = destination;
  }
};
var EsiReturnedBuyOrders = class extends CustomType {
  constructor(x0, location, page) {
    super();
    this[0] = x0;
    this.location = location;
    this.page = page;
  }
};
var EsiReturnedSellOrders = class extends CustomType {
  constructor(x0, location, page) {
    super();
    this[0] = x0;
    this.location = location;
    this.page = page;
  }
};
var EsiReturnedTypeMetadata = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserClickedComputeMultibuys = class extends CustomType {
};
var UserClickedCopyMultibuy = class extends CustomType {
  constructor(multibuy) {
    super();
    this.multibuy = multibuy;
  }
};
var UserClickedExpandSidebar = class extends CustomType {
};
var UserClickedCollapseSidebar = class extends CustomType {
};
var UserUpdatedCollateral = class extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
};
var UserUpdatedAccountingLevel = class extends CustomType {
  constructor(level) {
    super();
    this.level = level;
  }
};
var UserCreatedShip = class extends CustomType {
};
var UserDeletedShip = class extends CustomType {
  constructor(deleted_ship) {
    super();
    this.deleted_ship = deleted_ship;
  }
};
var UserSelectedShip = class extends CustomType {
  constructor(ship_id) {
    super();
    this.ship_id = ship_id;
  }
};
var UserUpdatedShipName = class extends CustomType {
  constructor(id2) {
    super();
    this.id = id2;
  }
};
var UserUpdatedShipHoldName = class extends CustomType {
  constructor(hold_id, ship_id) {
    super();
    this.hold_id = hold_id;
    this.ship_id = ship_id;
  }
};
var UserUpdatedShipHoldCapacity = class extends CustomType {
  constructor(hold_id, ship_id) {
    super();
    this.hold_id = hold_id;
    this.ship_id = ship_id;
  }
};
var UserUpdatedShipHoldKind = class extends CustomType {
  constructor(kind, hold_id, ship_id) {
    super();
    this.kind = kind;
    this.hold_id = hold_id;
    this.ship_id = ship_id;
  }
};
var UserAddedHoldToShip = class extends CustomType {
  constructor(ship_id) {
    super();
    this.ship_id = ship_id;
  }
};
var UserDeletedHoldFromShip = class extends CustomType {
  constructor(hold_id, ship_id) {
    super();
    this.hold_id = hold_id;
    this.ship_id = ship_id;
  }
};
var UserCollapsedShip = class extends CustomType {
  constructor(ship_id) {
    super();
    this.ship_id = ship_id;
  }
};
var UserExpandedShip = class extends CustomType {
  constructor(ship_id) {
    super();
    this.ship_id = ship_id;
  }
};
var InitLoadStorage = class extends CustomType {
  constructor(storage) {
    super();
    this.storage = storage;
  }
};
var InitStoreLoadFailed = class extends CustomType {
};
var StoreWriteFailed = class extends CustomType {
  constructor(storage_key, value3) {
    super();
    this.storage_key = storage_key;
    this.value = value3;
  }
};
var InitStoreReadFailed = class extends CustomType {
  constructor(storage_key) {
    super();
    this.storage_key = storage_key;
  }
};
var InitStoreReadShipName = class extends CustomType {
  constructor(name2, id2) {
    super();
    this.name = name2;
    this.id = id2;
  }
};
var InitStoreReadHoldName = class extends CustomType {
  constructor(name2, ship_id, hold_id) {
    super();
    this.name = name2;
    this.ship_id = ship_id;
    this.hold_id = hold_id;
  }
};
var InitStoreReadHoldCapacity = class extends CustomType {
  constructor(capacity, ship_id, hold_id) {
    super();
    this.capacity = capacity;
    this.ship_id = ship_id;
    this.hold_id = hold_id;
  }
};
var InitStoreReadHoldKind = class extends CustomType {
  constructor(kind, ship_id, hold_id) {
    super();
    this.kind = kind;
    this.ship_id = ship_id;
    this.hold_id = hold_id;
  }
};
var InitStoreReadCollateral = class extends CustomType {
  constructor(collateral) {
    super();
    this.collateral = collateral;
  }
};
var InitStoreReadAccountingLevel = class extends CustomType {
  constructor(accounting_level) {
    super();
    this.accounting_level = accounting_level;
  }
};
var InitStoreReadHoldIndices = class extends CustomType {
  constructor(hold_indices) {
    super();
    this.hold_indices = hold_indices;
  }
};
var InitStoreReadSelectedShip = class extends CustomType {
  constructor(selected_ship) {
    super();
    this.selected_ship = selected_ship;
  }
};
function int_input_to_msg(input2, msg) {
  let _block;
  let _pipe = parse_int(input2);
  _block = from_result(_pipe);
  let value3 = _block;
  return msg(value3);
}

// build/dev/javascript/eve_arbitrage/clipboard_ffi.mjs
async function writeText(clipText) {
  try {
    return new Ok(await globalThis.navigator.clipboard.writeText(clipText));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/eve_arbitrage/mvu/update/side_effects/clipboard.mjs
function write(text4) {
  return from(
    (_) => {
      then_await(
        writeText(text4),
        (_2) => {
          return resolve(void 0);
        }
      );
      return void 0;
    }
  );
}

// build/dev/javascript/eve_arbitrage/mvu/update/side_effects/fetch_esi.mjs
function get_query_sell_orders_side_effect(location, from2, page) {
  let query_handler = expect_json(
    sell_orders_decoder(),
    (_capture) => {
      return new EsiReturnedSellOrders(_capture, from2, page);
    }
  );
  let url = get_market_orders_url(location, false, page);
  return get2(url, query_handler);
}
function get_query_buy_orders_side_effect(location, from2, page) {
  let query_handler = expect_json(
    buy_orders_decoder(),
    (_capture) => {
      return new EsiReturnedBuyOrders(_capture, from2, page);
    }
  );
  let url = get_market_orders_url(location, true, page);
  return get2(url, query_handler);
}
function get_query_type_metadata_side_effect(type_id) {
  let query_handler = expect_json(
    type_decoder2(),
    (var0) => {
      return new EsiReturnedTypeMetadata(var0);
    }
  );
  let url = get_type_id_metadata_url(type_id);
  return get2(url, query_handler);
}

// build/dev/javascript/eve_arbitrage/mvu/update/multibuys.mjs
function user_clicked_copy_multibuy(model, multibuy) {
  let multibuy_text = multibuy_to_string(multibuy);
  let side_effect = write(multibuy_text);
  console_log("Multibuy copied to clipboard");
  return [model, side_effect];
}
function user_clicked_compute_multibuys(model) {
  return guard(
    (() => {
      let _pipe = model.source;
      return is_none(_pipe);
    })() || (() => {
      let _pipe = model.destination;
      return is_none(_pipe);
    })(),
    [model, none()],
    () => {
      let $ = model.source;
      if (!($ instanceof Some)) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          37,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let source = $[0];
      let $1 = model.destination;
      if (!($1 instanceof Some)) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          38,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $1 }
        );
      }
      let dest = $1[0];
      let $2 = map_get(model.systems, source);
      if (!$2.isOk()) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          39,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $2 }
        );
      }
      let source$1 = $2[0];
      let $3 = map_get(model.systems, dest);
      if (!$3.isOk()) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          40,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $3 }
        );
      }
      let dest$1 = $3[0];
      let raw_trades = compute_trades(
        source$1.sell_orders,
        dest$1.buy_orders,
        (() => {
          let _pipe2 = model.accounting_level;
          return tax_percent_from_accounting_level(_pipe2);
        })()
      );
      let _block;
      let _record = model;
      _block = new Model(
        _record.storage,
        _record.ships,
        _record.current_ship,
        _record.count_ship_index,
        _record.count_hold_index,
        _record.systems,
        _record.source,
        _record.destination,
        _record.accounting_level,
        _record.language,
        _record.sidebar_expanded,
        _record.collateral,
        map2(raw_trades, (var0) => {
          return new RawTrade2(var0);
        })
      );
      let model$1 = _block;
      let _block$1;
      let _pipe = raw_trades;
      let _pipe$1 = map2(_pipe, (trade) => {
        return trade.item;
      });
      let _pipe$2 = unique(_pipe$1);
      let _pipe$3 = map2(
        _pipe$2,
        get_query_type_metadata_side_effect
      );
      _block$1 = batch(_pipe$3);
      let effect = _block$1;
      return [model$1, effect];
    }
  );
}
function esi_returned_type_metadata(model, esi_response) {
  if (!esi_response.isOk()) {
    let e = esi_response[0];
    console_error(
      (() => {
        let _pipe = e;
        return inspect2(_pipe);
      })()
    );
    return [model, none()];
  } else {
    let type_metadata = esi_response[0];
    let _block;
    let _pipe = model.trades;
    _block = map2(
      _pipe,
      (trade) => {
        if (trade instanceof RawTrade2) {
          let raw_trade = trade.raw_trade;
          let $2 = raw_trade.item === type_metadata.type_id;
          if (!$2) {
            let _pipe$1 = raw_trade;
            return new RawTrade2(_pipe$1);
          } else {
            let _pipe$1 = raw_trade_to_trade(
              raw_trade,
              type_metadata
            );
            let _pipe$2 = map3(
              _pipe$1,
              (var0) => {
                return new Trade2(var0);
              }
            );
            return unwrap2(
              _pipe$2,
              (() => {
                let _pipe$3 = raw_trade;
                return new RawTrade2(_pipe$3);
              })()
            );
          }
        } else {
          let any = trade;
          return any;
        }
      }
    );
    let new_trades = _block;
    let _block$1;
    let $ = all(
      new_trades,
      (trade) => {
        if (trade instanceof Trade2) {
          return true;
        } else {
          return false;
        }
      }
    );
    if ($) {
      let $1 = model.current_ship;
      if (!($1 instanceof Some)) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          96,
          "esi_returned_type_metadata",
          "Pattern match failed, no pattern matched the value.",
          { value: $1 }
        );
      }
      let current_ship = $1[0];
      let $2 = model.collateral;
      if (!($2 instanceof Some)) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          97,
          "esi_returned_type_metadata",
          "Pattern match failed, no pattern matched the value.",
          { value: $2 }
        );
      }
      let collateral = $2[0];
      let trades = map2(
        new_trades,
        (trade) => {
          if (!(trade instanceof Trade2)) {
            throw makeError(
              "let_assert",
              "mvu/update/multibuys",
              100,
              "",
              "Pattern match failed, no pattern matched the value.",
              { value: trade }
            );
          }
          let trade$1 = trade.trade;
          return trade$1;
        }
      );
      let $3 = map_get(model.ships, current_ship);
      if (!$3.isOk()) {
        throw makeError(
          "let_assert",
          "mvu/update/multibuys",
          103,
          "esi_returned_type_metadata",
          "Pattern match failed, no pattern matched the value.",
          { value: $3 }
        );
      }
      let selected_ship = $3[0];
      let _pipe$1 = trades_to_multibuys(
        trades,
        collateral,
        (() => {
          let _pipe$12 = selected_ship.ship.holds;
          return values(_pipe$12);
        })()
      );
      _block$1 = map2(
        _pipe$1,
        (var0) => {
          return new Multibuy2(var0);
        }
      );
    } else {
      _block$1 = new_trades;
    }
    let possibly_multibuys = _block$1;
    let _block$2;
    let _record = model;
    _block$2 = new Model(
      _record.storage,
      _record.ships,
      _record.current_ship,
      _record.count_ship_index,
      _record.count_hold_index,
      _record.systems,
      _record.source,
      _record.destination,
      _record.accounting_level,
      _record.language,
      _record.sidebar_expanded,
      _record.collateral,
      possibly_multibuys
    );
    let model$1 = _block$2;
    return [model$1, none()];
  }
}

// build/dev/javascript/eve_arbitrage/mvu/update/side_effects/config_to_storage.mjs
function get_store() {
  return from((dispatch) => {
    let _block;
    let $ = localStorage();
    if (!$.isOk()) {
      _block = new InitStoreLoadFailed();
    } else {
      let store = $[0];
      _block = new InitLoadStorage(store);
    }
    let _pipe = _block;
    return dispatch(_pipe);
  });
}
function get_ship_id_storage_key_string(ship_id) {
  return "ships/" + to_string(ship_id);
}
function delete_ship(storage, ship_id) {
  return from(
    (_) => {
      return removeManyItems(
        storage,
        get_ship_id_storage_key_string(ship_id) + "*"
      );
    }
  );
}
function get_hold_id_storage_key_string(ship_id, hold_id) {
  return get_ship_id_storage_key_string(ship_id) + "/holds/" + (() => {
    let _pipe = hold_id;
    return to_string(_pipe);
  })();
}
function delete_hold(storage, ship_id, hold_id) {
  return from(
    (_) => {
      return removeManyItems(
        storage,
        get_hold_id_storage_key_string(ship_id, hold_id) + "*"
      );
    }
  );
}
function store_write_to_effect(storage, storage_key, value3) {
  return from(
    (dispatch) => {
      let $ = setItem(storage, storage_key, value3);
      if (!$.isOk()) {
        return dispatch(new StoreWriteFailed(storage_key, value3));
      } else {
        return void 0;
      }
    }
  );
}
function write_ship_name(storage, ship_id, new_name) {
  return store_write_to_effect(
    storage,
    get_ship_id_storage_key_string(ship_id) + "/name",
    new_name
  );
}
function write_ship_hold_name(storage, ship_id, hold_id, new_name) {
  return store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/name",
    new_name
  );
}
function write_ship_hold_capacity(storage, ship_id, hold_id, new_capacity) {
  return store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/capacity",
    (() => {
      let _pipe = new_capacity;
      return float_to_string(_pipe);
    })()
  );
}
function write_ship_hold_kind(storage, ship_id, hold_id, new_kind) {
  return store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/kind",
    (() => {
      let _pipe = new_kind;
      return hold_kind_to_string(_pipe);
    })()
  );
}
function write_collateral(storage, collateral) {
  let _block;
  let _pipe = map(collateral, to_string);
  _block = unwrap(_pipe, "");
  let string_to_store = _block;
  return store_write_to_effect(storage, "collateral", string_to_store);
}
function write_accounting_level(storage, accounting_level) {
  return store_write_to_effect(
    storage,
    "accounting_level",
    (() => {
      let _pipe = accounting_level;
      return to_string(_pipe);
    })()
  );
}
function write_hold_indices(storage, hold_indices) {
  return store_write_to_effect(
    storage,
    "hold_indices",
    (() => {
      let _pipe = hold_indices;
      return ints_dict_to_string(_pipe);
    })()
  );
}
function write_selected_ship(storage, ship_id) {
  let _block;
  let _pipe = ship_id;
  let _pipe$1 = map(_pipe, to_string);
  _block = unwrap(_pipe$1, "");
  let ship_id_string = _block;
  return store_write_to_effect(storage, "selected_ship", ship_id_string);
}
function store_read_to_effect(storage, storage_key, parser, msg) {
  return from(
    (dispatch) => {
      let $ = try$(
        getItem(storage, storage_key),
        (value3) => {
          return parser(value3);
        }
      );
      if (!$.isOk()) {
        return dispatch(new InitStoreReadFailed(storage_key));
      } else {
        let value3 = $[0];
        return dispatch(msg(value3));
      }
    }
  );
}
function read_ship_name(storage, ship_id) {
  return store_read_to_effect(
    storage,
    get_ship_id_storage_key_string(ship_id) + "/name",
    (var0) => {
      return new Ok(var0);
    },
    (_capture) => {
      return new InitStoreReadShipName(_capture, ship_id);
    }
  );
}
function read_ship_hold_name(storage, ship_id, hold_id) {
  return store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/name",
    (var0) => {
      return new Ok(var0);
    },
    (_capture) => {
      return new InitStoreReadHoldName(_capture, ship_id, hold_id);
    }
  );
}
function read_ship_hold_capacity(storage, ship_id, hold_id) {
  return store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/capacity",
    parse_float,
    (_capture) => {
      return new InitStoreReadHoldCapacity(_capture, ship_id, hold_id);
    }
  );
}
function read_ship_hold_kind(storage, ship_id, hold_id) {
  return store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) + "/kind",
    hold_kind_from_string,
    (_capture) => {
      return new InitStoreReadHoldKind(_capture, ship_id, hold_id);
    }
  );
}
function read_collateral(storage) {
  return store_read_to_effect(
    storage,
    "collateral",
    (value3) => {
      let _pipe = parse_int(value3);
      let _pipe$1 = from_result(_pipe);
      return new Ok(_pipe$1);
    },
    (var0) => {
      return new InitStoreReadCollateral(var0);
    }
  );
}
function read_accounting_level(storage) {
  return store_read_to_effect(
    storage,
    "accounting_level",
    parse_int,
    (var0) => {
      return new InitStoreReadAccountingLevel(var0);
    }
  );
}
function read_hold_indices(storage) {
  return store_read_to_effect(
    storage,
    "hold_indices",
    string_to_ints_dict,
    (var0) => {
      return new InitStoreReadHoldIndices(var0);
    }
  );
}
function read_selected_ship(storage) {
  return store_read_to_effect(
    storage,
    "selected_ship",
    (value3) => {
      let _pipe = parse_int(value3);
      let _pipe$1 = from_result(_pipe);
      return new Ok(_pipe$1);
    },
    (var0) => {
      return new InitStoreReadSelectedShip(var0);
    }
  );
}

// build/dev/javascript/eve_arbitrage/element_ffi.mjs
function value2(element3) {
  let value3 = element3.value;
  if (value3 != void 0) {
    return new Ok(value3);
  }
  return new Error();
}
function getElementById(id2) {
  let found = document.getElementById(id2);
  if (!found) {
    return new Error();
  }
  return new Ok(found);
}

// build/dev/javascript/eve_arbitrage/mvu/update/ships.mjs
function user_selected_ship(selected_ship, model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    new Some(selected_ship),
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let _block$1;
  let $ = model$1.storage;
  if ($ instanceof None) {
    _block$1 = none();
  } else {
    let storage = $[0];
    _block$1 = write_selected_ship(
      storage,
      new Some(selected_ship)
    );
  }
  let effect = _block$1;
  console_log(
    "Ship #" + (() => {
      let _pipe = selected_ship;
      return to_string(_pipe);
    })() + " selected"
  );
  return [model$1, effect];
}
function user_created_ship(model) {
  let default_ship_entry = new ShipEntry(
    new Ship(
      "New Ship",
      (() => {
        let _pipe = toList([
          [
            model.count_hold_index,
            new Hold("Cargo", new Generic(), 1e3)
          ]
        ]);
        return from_list(_pipe);
      })()
    ),
    true
  );
  let ships = insert(
    model.ships,
    model.count_ship_index,
    default_ship_entry
  );
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    ships,
    _record.current_ship,
    model.count_ship_index + 1,
    model.count_hold_index + 1,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let _block$1;
  let $ = model$1.storage;
  if ($ instanceof None) {
    _block$1 = none();
  } else {
    let storage = $[0];
    _block$1 = batch(
      toList([
        write_ship_name(
          storage,
          model$1.count_ship_index - 1,
          "New Ship"
        ),
        write_hold_indices(
          storage,
          (() => {
            let _pipe = model$1.ships;
            return map_values(
              _pipe,
              (_, ship_entry) => {
                let _pipe$1 = ship_entry.ship.holds;
                return keys(_pipe$1);
              }
            );
          })()
        ),
        write_ship_hold_name(
          storage,
          model$1.count_ship_index - 1,
          model$1.count_hold_index - 1,
          "Cargo"
        ),
        write_ship_hold_capacity(
          storage,
          model$1.count_ship_index - 1,
          model$1.count_hold_index - 1,
          1e3
        ),
        write_ship_hold_kind(
          storage,
          model$1.count_ship_index - 1,
          model$1.count_hold_index - 1,
          new Generic()
        )
      ])
    );
  }
  let effect = _block$1;
  return [model$1, effect];
}
function user_deleted_ship(model, deleted_ship) {
  let ships = delete$(model.ships, deleted_ship);
  let _block;
  let $ = model.current_ship;
  if ($ instanceof Some && $[0] === deleted_ship) {
    let id2 = $[0];
    _block = new None();
  } else {
    let any = $;
    _block = any;
  }
  let selected_ship = _block;
  let _block$1;
  let _record = model;
  _block$1 = new Model(
    _record.storage,
    ships,
    selected_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block$1;
  let _block$2;
  let $1 = model$1.storage;
  if ($1 instanceof None) {
    _block$2 = none();
  } else {
    let storage = $1[0];
    _block$2 = batch(
      toList([
        delete_ship(storage, deleted_ship),
        write_hold_indices(
          storage,
          (() => {
            let _pipe = model$1.ships;
            return map_values(
              _pipe,
              (_, ship_entry) => {
                let _pipe$1 = ship_entry.ship.holds;
                return keys(_pipe$1);
              }
            );
          })()
        ),
        write_selected_ship(storage, new None())
      ])
    );
  }
  let effect = _block$2;
  return [model$1, effect];
}
function user_updated_ship_hold_kind(model, hold_kind, hold_id, ship_id) {
  let $ = hold_kind_from_string(hold_kind);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      217,
      "user_updated_ship_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let hold_kind$1 = $[0];
  let $1 = map_get(model.ships, ship_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      218,
      "user_updated_ship_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let ship_entry = $1[0];
  let ship = ship_entry.ship;
  let $2 = map_get(ship.holds, hold_id);
  if (!$2.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      220,
      "user_updated_ship_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $2 }
    );
  }
  let hold = $2[0];
  let _block;
  let _record = hold;
  _block = new Hold(_record.name, hold_kind$1, _record.capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let ship$1 = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(ship$1, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  let _block$4;
  let $3 = model$1.storage;
  if ($3 instanceof None) {
    _block$4 = none();
  } else {
    let storage = $3[0];
    _block$4 = write_ship_hold_kind(
      storage,
      ship_id,
      hold_id,
      hold_kind$1
    );
  }
  let effect = _block$4;
  return [model$1, effect];
}
function user_added_hold_to_ship(model, ship_id) {
  let new_hold = new Hold("New Hold", new Generic(), 100);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      246,
      "user_added_hold_to_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let holds = insert(ship.holds, model.count_hold_index, new_hold);
  let _block;
  let _record = ship;
  _block = new Ship(_record.name, holds);
  let ship$1 = _block;
  let _block$1;
  let _record$1 = ship_entry;
  _block$1 = new ShipEntry(ship$1, _record$1.is_expanded);
  let ship_entry$1 = _block$1;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$2;
  let _record$2 = model;
  _block$2 = new Model(
    _record$2.storage,
    ship_entries,
    _record$2.current_ship,
    _record$2.count_ship_index,
    model.count_hold_index + 1,
    _record$2.systems,
    _record$2.source,
    _record$2.destination,
    _record$2.accounting_level,
    _record$2.language,
    _record$2.sidebar_expanded,
    _record$2.collateral,
    _record$2.trades
  );
  let model$1 = _block$2;
  let _block$3;
  let $1 = model$1.storage;
  if ($1 instanceof None) {
    _block$3 = none();
  } else {
    let storage = $1[0];
    _block$3 = batch(
      toList([
        write_hold_indices(
          storage,
          (() => {
            let _pipe = model$1.ships;
            return map_values(
              _pipe,
              (_, ship_entry2) => {
                let _pipe$1 = ship_entry2.ship.holds;
                return keys(_pipe$1);
              }
            );
          })()
        ),
        write_ship_hold_name(
          storage,
          ship_id,
          model$1.count_hold_index - 1,
          "New Hold"
        ),
        write_ship_hold_capacity(
          storage,
          ship_id,
          model$1.count_hold_index - 1,
          100
        ),
        write_ship_hold_kind(
          storage,
          ship_id,
          model$1.count_hold_index - 1,
          new Generic()
        )
      ])
    );
  }
  let effect = _block$3;
  return [model$1, effect];
}
function user_deleted_hold_from_ship(model, hold_id, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      298,
      "user_deleted_hold_from_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let holds = delete$(ship_entry.ship.holds, hold_id);
  let _block;
  let _record = ship_entry.ship;
  _block = new Ship(_record.name, holds);
  let ship = _block;
  let _block$1;
  let _record$1 = ship_entry;
  _block$1 = new ShipEntry(ship, _record$1.is_expanded);
  let ship_entry$1 = _block$1;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$2;
  let _record$2 = model;
  _block$2 = new Model(
    _record$2.storage,
    ship_entries,
    _record$2.current_ship,
    _record$2.count_ship_index,
    _record$2.count_hold_index,
    _record$2.systems,
    _record$2.source,
    _record$2.destination,
    _record$2.accounting_level,
    _record$2.language,
    _record$2.sidebar_expanded,
    _record$2.collateral,
    _record$2.trades
  );
  let model$1 = _block$2;
  let _block$3;
  let $1 = model$1.storage;
  if ($1 instanceof None) {
    _block$3 = none();
  } else {
    let storage = $1[0];
    _block$3 = batch(
      toList([
        delete_hold(storage, ship_id, hold_id),
        write_hold_indices(
          storage,
          (() => {
            let _pipe = model$1.ships;
            return map_values(
              _pipe,
              (_, ship_entry2) => {
                let _pipe$1 = ship_entry2.ship.holds;
                return keys(_pipe$1);
              }
            );
          })()
        )
      ])
    );
  }
  let effect = _block$3;
  return [model$1, effect];
}
function user_collapsed_ship(model, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      326,
      "user_collapsed_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let _block;
  let _record = ship_entry;
  _block = new ShipEntry(_record.ship, false);
  let ship_entry$1 = _block;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$1;
  let _record$1 = model;
  _block$1 = new Model(
    _record$1.storage,
    ship_entries,
    _record$1.current_ship,
    _record$1.count_ship_index,
    _record$1.count_hold_index,
    _record$1.systems,
    _record$1.source,
    _record$1.destination,
    _record$1.accounting_level,
    _record$1.language,
    _record$1.sidebar_expanded,
    _record$1.collateral,
    _record$1.trades
  );
  let model$1 = _block$1;
  return [model$1, none()];
}
function user_expanded_ship(model, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      337,
      "user_expanded_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let _block;
  let _record = ship_entry;
  _block = new ShipEntry(_record.ship, true);
  let ship_entry$1 = _block;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$1;
  let _record$1 = model;
  _block$1 = new Model(
    _record$1.storage,
    ship_entries,
    _record$1.current_ship,
    _record$1.count_ship_index,
    _record$1.count_hold_index,
    _record$1.systems,
    _record$1.source,
    _record$1.destination,
    _record$1.accounting_level,
    _record$1.language,
    _record$1.sidebar_expanded,
    _record$1.collateral,
    _record$1.trades
  );
  let model$1 = _block$1;
  return [model$1, none()];
}
function fetch_input_value_from_element_id_or_default(element_id, default_value) {
  let element_result = getElementById(element_id);
  let value_result = try$(
    element_result,
    (element3) => {
      return value2(element3);
    }
  );
  let value3 = unwrap2(value_result, default_value);
  let $ = (() => {
    let _pipe = value3;
    return trim(_pipe);
  })();
  if ($ === "") {
    return default_value;
  } else {
    let any = $;
    return any;
  }
}
function user_updated_ship_name(model, id2) {
  let element_id = "ship-name-" + to_string(id2);
  let $ = map_get(model.ships, id2);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      129,
      "user_updated_ship_name",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship = $[0];
  let default_value = ship.ship.name;
  let name2 = fetch_input_value_from_element_id_or_default(
    element_id,
    default_value
  );
  let _block;
  {
    let $12 = map_get(model.ships, id2);
    if (!$12.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/ships",
        136,
        "user_updated_ship_name",
        "Pattern match failed, no pattern matched the value.",
        { value: $12 }
      );
    }
    let ship_entry = $12[0];
    let ship$1 = ship_entry.ship;
    let _block$12;
    let _record = ship$1;
    _block$12 = new Ship(name2, _record.holds);
    let ship$2 = _block$12;
    let _block$2;
    let _record$1 = ship_entry;
    _block$2 = new ShipEntry(ship$2, _record$1.is_expanded);
    let ship_entry$1 = _block$2;
    let _record$2 = model;
    _block = new Model(
      _record$2.storage,
      insert(model.ships, id2, ship_entry$1),
      _record$2.current_ship,
      _record$2.count_ship_index,
      _record$2.count_hold_index,
      _record$2.systems,
      _record$2.source,
      _record$2.destination,
      _record$2.accounting_level,
      _record$2.language,
      _record$2.sidebar_expanded,
      _record$2.collateral,
      _record$2.trades
    );
  }
  let model$1 = _block;
  let _block$1;
  let $1 = model$1.storage;
  if ($1 instanceof None) {
    _block$1 = none();
  } else {
    let storage = $1[0];
    _block$1 = write_ship_name(storage, id2, name2);
  }
  let effect = _block$1;
  return [model$1, effect];
}
function user_updated_ship_hold_name(model, hold_id, ship_id) {
  let element_id = "hold-name-" + to_string(hold_id);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      155,
      "user_updated_ship_hold_name",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let $1 = map_get(ship.holds, hold_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      157,
      "user_updated_ship_hold_name",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let hold = $1[0];
  let default_value = hold.name;
  let name2 = fetch_input_value_from_element_id_or_default(
    element_id,
    default_value
  );
  let _block;
  let _record = hold;
  _block = new Hold(name2, _record.kind, _record.capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let new_ship = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(new_ship, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  let _block$4;
  let $2 = model$1.storage;
  if ($2 instanceof None) {
    _block$4 = none();
  } else {
    let storage = $2[0];
    _block$4 = write_ship_hold_name(
      storage,
      ship_id,
      hold_id,
      name2
    );
  }
  let effect = _block$4;
  return [model$1, effect];
}
function fetch_float_input_value_from_element_id_or_default(element_id, default_value) {
  let element_result = getElementById(element_id);
  let value_result = try$(
    element_result,
    (element3) => {
      return value2(element3);
    }
  );
  let float_parse_result = try$(value_result, parse_float);
  let _block;
  let _pipe = try$(value_result, parse_int);
  _block = map3(_pipe, identity);
  let int_parse_result = _block;
  let _block$1;
  let _pipe$1 = float_parse_result;
  _block$1 = or(_pipe$1, int_parse_result);
  let value_result$1 = _block$1;
  return unwrap2(value_result$1, default_value);
}
function user_updated_ship_hold_capacity(model, hold_id, ship_id) {
  let element_id = "hold-capacity-" + to_string(hold_id);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      182,
      "user_updated_ship_hold_capacity",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let $1 = map_get(ship.holds, hold_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      184,
      "user_updated_ship_hold_capacity",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let hold = $1[0];
  let default_value = hold.capacity;
  let capacity = fetch_float_input_value_from_element_id_or_default(
    element_id,
    default_value
  );
  let _block;
  let _record = hold;
  _block = new Hold(_record.name, _record.kind, capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let new_ship = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(new_ship, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  let _block$4;
  let $2 = model$1.storage;
  if ($2 instanceof None) {
    _block$4 = none();
  } else {
    let storage = $2[0];
    _block$4 = write_ship_hold_capacity(
      storage,
      ship_id,
      hold_id,
      capacity
    );
  }
  let effect = _block$4;
  return [model$1, effect];
}

// build/dev/javascript/eve_arbitrage/mvu/update/sidebar.mjs
function user_clicked_collapse_sidebar(model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    false,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  return [model$1, none()];
}
function user_clicked_expand_sidebar(model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    true,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  return [model$1, none()];
}
function user_updated_collateral(model, value3) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    value3,
    _record.trades
  );
  let model$1 = _block;
  let _block$1;
  let $ = model$1.storage;
  if ($ instanceof None) {
    _block$1 = none();
  } else {
    let storage = $[0];
    _block$1 = write_collateral(storage, value3);
  }
  let effect = _block$1;
  return [model$1, effect];
}
function user_updated_accounting_level(model, level) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let _block$1;
  let $ = model$1.storage;
  if ($ instanceof None) {
    _block$1 = none();
  } else {
    let storage = $[0];
    _block$1 = write_accounting_level(storage, level);
  }
  let effect = _block$1;
  return [model$1, effect];
}

// build/dev/javascript/eve_arbitrage/window_ffi.mjs
function alert(message) {
  window.alert(message);
}

// build/dev/javascript/eve_arbitrage/mvu/update/store.mjs
function init_load_storage(model, storage) {
  let _block;
  let _record = model;
  _block = new Model(
    new Some(storage),
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let effect = batch(
    toList([
      read_collateral(storage),
      read_accounting_level(storage),
      read_hold_indices(storage),
      read_selected_ship(storage)
    ])
  );
  return [model$1, effect];
}
function store_load_failed(model) {
  alert("Failed to load local storage\nCheck console log for more info");
  return [model, none()];
}
function store_write_failed(model, storage_key, value3) {
  alert(
    'Failed to write storage key "' + storage_key + '" with value "' + value3 + '"\nCheck console log for more info'
  );
  return [model, none()];
}
function store_read_failed(model, storage_key) {
  console_error('Failed to read storage key "' + storage_key + '"');
  return [model, none()];
}
function store_read_ship_name(model, name2, id2) {
  let _block;
  {
    let $ = map_get(model.ships, id2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/store",
        65,
        "store_read_ship_name",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let ship_entry = $[0];
    let ship = ship_entry.ship;
    let _block$1;
    let _record = ship;
    _block$1 = new Ship(name2, _record.holds);
    let ship$1 = _block$1;
    let _block$2;
    let _record$1 = ship_entry;
    _block$2 = new ShipEntry(ship$1, _record$1.is_expanded);
    let ship_entry$1 = _block$2;
    let _record$2 = model;
    _block = new Model(
      _record$2.storage,
      insert(model.ships, id2, ship_entry$1),
      _record$2.current_ship,
      _record$2.count_ship_index,
      _record$2.count_hold_index,
      _record$2.systems,
      _record$2.source,
      _record$2.destination,
      _record$2.accounting_level,
      _record$2.language,
      _record$2.sidebar_expanded,
      _record$2.collateral,
      _record$2.trades
    );
  }
  let model$1 = _block;
  return [model$1, none()];
}
function store_read_accounting_level(model, accounting_level) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  return [model$1, none()];
}
function store_read_collateral(model, collateral) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    collateral,
    _record.trades
  );
  let model$1 = _block;
  return [model$1, none()];
}
function store_read_hold_capacity(model, capacity, ship_id, hold_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      96,
      "store_read_hold_capacity",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let $1 = map_get(ship.holds, hold_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      98,
      "store_read_hold_capacity",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let hold = $1[0];
  let _block;
  let _record = hold;
  _block = new Hold(_record.name, _record.kind, capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let new_ship = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(new_ship, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  return [model$1, none()];
}
function store_read_hold_indices(model, hold_indices) {
  let $ = model.storage;
  if ($ instanceof Some) {
    let storage = $[0];
    let ship_entries = map_values(
      hold_indices,
      (_, hold_ids) => {
        let _block2;
        let _pipe2 = map2(
          hold_ids,
          (hold_id) => {
            return [
              hold_id,
              new Hold("New Hold", new Generic(), 100)
            ];
          }
        );
        _block2 = from_list(_pipe2);
        let holds = _block2;
        let ship = new Ship("New Ship", holds);
        return new ShipEntry(ship, false);
      }
    );
    let _block;
    let _record = model;
    _block = new Model(
      _record.storage,
      ship_entries,
      _record.current_ship,
      _record.count_ship_index,
      _record.count_hold_index,
      _record.systems,
      _record.source,
      _record.destination,
      _record.accounting_level,
      _record.language,
      _record.sidebar_expanded,
      _record.collateral,
      _record.trades
    );
    let model$1 = _block;
    let _block$1;
    let _pipe = map_values(
      hold_indices,
      (ship_id, hold_ids) => {
        let ship_read_effects = toList([
          read_ship_name(storage, ship_id)
        ]);
        return fold(
          hold_ids,
          ship_read_effects,
          (effects, hold_id) => {
            return prepend(
              read_ship_hold_name(storage, ship_id, hold_id),
              prepend(
                read_ship_hold_capacity(
                  storage,
                  ship_id,
                  hold_id
                ),
                prepend(
                  read_ship_hold_kind(
                    storage,
                    ship_id,
                    hold_id
                  ),
                  effects
                )
              )
            );
          }
        );
      }
    );
    let _pipe$1 = values(_pipe);
    let _pipe$2 = flatten(_pipe$1);
    _block$1 = batch(_pipe$2);
    let effect = _block$1;
    return [model$1, effect];
  } else {
    return [model, none()];
  }
}
function store_read_hold_kind(model, hold_kind, ship_id, hold_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      158,
      "store_read_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let $1 = map_get(ship.holds, hold_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      160,
      "store_read_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let hold = $1[0];
  let _block;
  let _record = hold;
  _block = new Hold(_record.name, hold_kind, _record.capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let ship$1 = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(ship$1, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  return [model$1, none()];
}
function store_read_hold_name(model, hold_name, ship_id, hold_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      176,
      "store_read_hold_name",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let $1 = map_get(ship.holds, hold_id);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/store",
      178,
      "store_read_hold_name",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let hold = $1[0];
  let _block;
  let _record = hold;
  _block = new Hold(hold_name, _record.kind, _record.capacity);
  let hold$1 = _block;
  let holds = insert(ship.holds, hold_id, hold$1);
  let _block$1;
  let _record$1 = ship;
  _block$1 = new Ship(_record$1.name, holds);
  let new_ship = _block$1;
  let _block$2;
  let _record$2 = ship_entry;
  _block$2 = new ShipEntry(new_ship, _record$2.is_expanded);
  let ship_entry$1 = _block$2;
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let _block$3;
  let _record$3 = model;
  _block$3 = new Model(
    _record$3.storage,
    ship_entries,
    _record$3.current_ship,
    _record$3.count_ship_index,
    _record$3.count_hold_index,
    _record$3.systems,
    _record$3.source,
    _record$3.destination,
    _record$3.accounting_level,
    _record$3.language,
    _record$3.sidebar_expanded,
    _record$3.collateral,
    _record$3.trades
  );
  let model$1 = _block$3;
  return [model$1, none()];
}
function store_read_selected_ship(model, ship_id) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    ship_id,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  return [model$1, none()];
}

// build/dev/javascript/eve_arbitrage/mvu/update/systems.mjs
function user_selected_source(new_source, model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    new Some(new_source),
    _record.destination,
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let side_effect = none();
  console_log("Source " + new_source + " selected");
  return [model$1, side_effect];
}
function user_selected_destination(new_dest, model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.storage,
    _record.ships,
    _record.current_ship,
    _record.count_ship_index,
    _record.count_hold_index,
    _record.systems,
    _record.source,
    new Some(new_dest),
    _record.accounting_level,
    _record.language,
    _record.sidebar_expanded,
    _record.collateral,
    _record.trades
  );
  let model$1 = _block;
  let side_effect = none();
  console_log("Destination " + new_dest + " selected");
  return [model$1, side_effect];
}
function esi_returned_sell_orders(model, esi_response, from2, page) {
  if (!esi_response.isOk() && esi_response[0] instanceof HttpError && esi_response[0][0] instanceof Response && esi_response[0][0].status === 404 && esi_response[0][0].body === '{"error":"Requested page does not exist!"}') {
    console_log("Reached sell orders last page for location " + from2);
    let $ = map_get(model.systems, from2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        48,
        "esi_returned_sell_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let system = $[0];
    console_log(
      (() => {
        let _pipe = system.sell_orders;
        let _pipe$1 = length(_pipe);
        return to_string(_pipe$1);
      })() + " sell orders found"
    );
    let $1 = map_get(model.systems, from2);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        54,
        "esi_returned_sell_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let system$1 = $1[0];
    let _block;
    let _record = system$1;
    _block = new System(
      _record.location,
      _record.buy_orders,
      _record.buy_orders_status,
      _record.sell_orders,
      new Loaded(system_time2())
    );
    let system$2 = _block;
    let systems = upsert(
      model.systems,
      from2,
      (found) => {
        lazy_unwrap(
          found,
          () => {
            throw makeError(
              "panic",
              "mvu/update/systems",
              64,
              "",
              "system " + from2 + " should be present",
              {}
            );
          }
        );
        return system$2;
      }
    );
    let _block$1;
    let _record$1 = model;
    _block$1 = new Model(
      _record$1.storage,
      _record$1.ships,
      _record$1.current_ship,
      _record$1.count_ship_index,
      _record$1.count_hold_index,
      systems,
      _record$1.source,
      _record$1.destination,
      _record$1.accounting_level,
      _record$1.language,
      _record$1.sidebar_expanded,
      _record$1.collateral,
      _record$1.trades
    );
    let model$1 = _block$1;
    return [model$1, none()];
  } else if (!esi_response.isOk()) {
    let e = esi_response[0];
    console_error(
      (() => {
        let _pipe = e;
        return inspect2(_pipe);
      })()
    );
    return [model, none()];
  } else {
    let orders = esi_response[0];
    let $ = map_get(model.systems, from2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        76,
        "esi_returned_sell_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let system = $[0];
    let filtered_orders = filter(
      orders,
      (order) => {
        return contains(system.location.stations, order.location_id);
      }
    );
    let systems = insert(
      model.systems,
      from2,
      (() => {
        let _record = system;
        return new System(
          _record.location,
          _record.buy_orders,
          _record.buy_orders_status,
          (() => {
            let _pipe = system.sell_orders;
            return append(_pipe, filtered_orders);
          })(),
          _record.sell_orders_status
        );
      })()
    );
    let $1 = map_get(model.systems, from2);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        90,
        "esi_returned_sell_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let system$1 = $1[0];
    console_log(
      "Fetched " + from2 + " sell orders page " + to_string(page)
    );
    return [
      (() => {
        let _record = model;
        return new Model(
          _record.storage,
          _record.ships,
          _record.current_ship,
          _record.count_ship_index,
          _record.count_hold_index,
          systems,
          _record.source,
          _record.destination,
          _record.accounting_level,
          _record.language,
          _record.sidebar_expanded,
          _record.collateral,
          _record.trades
        );
      })(),
      get_query_sell_orders_side_effect(
        system$1.location,
        from2,
        page + 1
      )
    ];
  }
}
function esi_returned_buy_orders(model, esi_response, from2, page) {
  if (!esi_response.isOk() && esi_response[0] instanceof HttpError && esi_response[0][0] instanceof Response && esi_response[0][0].status === 404 && esi_response[0][0].body === '{"error":"Requested page does not exist!"}') {
    console_log("Reached buy orders last page for location " + from2);
    let $ = map_get(model.systems, from2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        119,
        "esi_returned_buy_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let system = $[0];
    console_log(
      (() => {
        let _pipe = system.buy_orders;
        let _pipe$1 = length(_pipe);
        return to_string(_pipe$1);
      })() + " buy orders found"
    );
    let $1 = map_get(model.systems, from2);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        123,
        "esi_returned_buy_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let system$1 = $1[0];
    let _block;
    let _record = system$1;
    _block = new System(
      _record.location,
      _record.buy_orders,
      new Loaded(system_time2()),
      _record.sell_orders,
      _record.sell_orders_status
    );
    let system$2 = _block;
    let systems = upsert(
      model.systems,
      from2,
      (found) => {
        lazy_unwrap(
          found,
          () => {
            throw makeError(
              "panic",
              "mvu/update/systems",
              133,
              "",
              "system " + from2 + " should be present",
              {}
            );
          }
        );
        return system$2;
      }
    );
    let _block$1;
    let _record$1 = model;
    _block$1 = new Model(
      _record$1.storage,
      _record$1.ships,
      _record$1.current_ship,
      _record$1.count_ship_index,
      _record$1.count_hold_index,
      systems,
      _record$1.source,
      _record$1.destination,
      _record$1.accounting_level,
      _record$1.language,
      _record$1.sidebar_expanded,
      _record$1.collateral,
      _record$1.trades
    );
    let model$1 = _block$1;
    return [model$1, none()];
  } else if (!esi_response.isOk()) {
    let e = esi_response[0];
    console_error(
      (() => {
        let _pipe = e;
        return inspect2(_pipe);
      })()
    );
    return [model, none()];
  } else {
    let orders = esi_response[0];
    let systems = upsert(
      model.systems,
      from2,
      (system_option) => {
        let system2 = lazy_unwrap(
          system_option,
          () => {
            throw makeError(
              "panic",
              "mvu/update/systems",
              149,
              "",
              "system " + from2 + " should be present",
              {}
            );
          }
        );
        let _record = system2;
        return new System(
          _record.location,
          (() => {
            let _pipe = system2.buy_orders;
            return append(_pipe, orders);
          })(),
          _record.buy_orders_status,
          _record.sell_orders,
          _record.sell_orders_status
        );
      }
    );
    let $ = map_get(model.systems, from2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        156,
        "esi_returned_buy_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let system = $[0];
    console_log(
      "Fetched " + from2 + " buy orders page " + to_string(page)
    );
    return [
      (() => {
        let _record = model;
        return new Model(
          _record.storage,
          _record.ships,
          _record.current_ship,
          _record.count_ship_index,
          _record.count_hold_index,
          systems,
          _record.source,
          _record.destination,
          _record.accounting_level,
          _record.language,
          _record.sidebar_expanded,
          _record.collateral,
          _record.trades
        );
      })(),
      get_query_buy_orders_side_effect(
        system.location,
        from2,
        page + 1
      )
    ];
  }
}
function user_loaded_source(model, from2) {
  let $ = map_get(model.systems, from2);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/systems",
      176,
      "user_loaded_source",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let system = $[0];
  let side_effect = get_query_sell_orders_side_effect(
    system.location,
    from2,
    1
  );
  let _block;
  let _record = system;
  _block = new System(
    _record.location,
    _record.buy_orders,
    _record.buy_orders_status,
    toList([]),
    new Loading()
  );
  let system$1 = _block;
  let systems = upsert(
    model.systems,
    from2,
    (found) => {
      lazy_unwrap(
        found,
        () => {
          throw makeError(
            "panic",
            "mvu/update/systems",
            184,
            "",
            "did not find system " + from2,
            {}
          );
        }
      );
      return system$1;
    }
  );
  let _block$1;
  let $1 = model.source;
  if ($1 instanceof Some && $1[0] === from2) {
    let current_source = $1[0];
    let _record$1 = model;
    _block$1 = new Model(
      _record$1.storage,
      _record$1.ships,
      _record$1.current_ship,
      _record$1.count_ship_index,
      _record$1.count_hold_index,
      _record$1.systems,
      new None(),
      _record$1.destination,
      _record$1.accounting_level,
      _record$1.language,
      _record$1.sidebar_expanded,
      _record$1.collateral,
      _record$1.trades
    );
  } else {
    _block$1 = model;
  }
  let model$1 = _block$1;
  return [
    (() => {
      let _record$1 = model$1;
      return new Model(
        _record$1.storage,
        _record$1.ships,
        _record$1.current_ship,
        _record$1.count_ship_index,
        _record$1.count_hold_index,
        systems,
        _record$1.source,
        _record$1.destination,
        _record$1.accounting_level,
        _record$1.language,
        _record$1.sidebar_expanded,
        _record$1.collateral,
        _record$1.trades
      );
    })(),
    side_effect
  ];
}
function user_loaded_destination(model, to) {
  let $ = map_get(model.systems, to);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/systems",
      200,
      "user_loaded_destination",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let system = $[0];
  let side_effect = get_query_buy_orders_side_effect(
    system.location,
    to,
    1
  );
  let _block;
  let _record = system;
  _block = new System(
    _record.location,
    toList([]),
    new Loading(),
    _record.sell_orders,
    _record.sell_orders_status
  );
  let system$1 = _block;
  let systems = upsert(
    model.systems,
    to,
    (found) => {
      lazy_unwrap(
        found,
        () => {
          throw makeError(
            "panic",
            "mvu/update/systems",
            208,
            "",
            "did not find system " + to,
            {}
          );
        }
      );
      return system$1;
    }
  );
  let _block$1;
  let $1 = model.destination;
  if ($1 instanceof Some && $1[0] === to) {
    let current_destination = $1[0];
    let _record$1 = model;
    _block$1 = new Model(
      _record$1.storage,
      _record$1.ships,
      _record$1.current_ship,
      _record$1.count_ship_index,
      _record$1.count_hold_index,
      _record$1.systems,
      _record$1.source,
      new None(),
      _record$1.accounting_level,
      _record$1.language,
      _record$1.sidebar_expanded,
      _record$1.collateral,
      _record$1.trades
    );
  } else {
    _block$1 = model;
  }
  let model$1 = _block$1;
  return [
    (() => {
      let _record$1 = model$1;
      return new Model(
        _record$1.storage,
        _record$1.ships,
        _record$1.current_ship,
        _record$1.count_ship_index,
        _record$1.count_hold_index,
        systems,
        _record$1.source,
        _record$1.destination,
        _record$1.accounting_level,
        _record$1.language,
        _record$1.sidebar_expanded,
        _record$1.collateral,
        _record$1.trades
      );
    })(),
    side_effect
  ];
}

// build/dev/javascript/eve_arbitrage/mvu/update.mjs
function run2(model, msg) {
  if (msg instanceof UserSelectedDestination) {
    let new_destination = msg.new_destination;
    return user_selected_destination(new_destination, model);
  } else if (msg instanceof UserSelectedSource) {
    let new_source = msg.new_source;
    return user_selected_source(new_source, model);
  } else if (msg instanceof UserSelectedShip) {
    let selected_ship = msg.ship_id;
    return user_selected_ship(selected_ship, model);
  } else if (msg instanceof EsiReturnedBuyOrders) {
    let esi_response = msg[0];
    let location = msg.location;
    let page = msg.page;
    return esi_returned_buy_orders(model, esi_response, location, page);
  } else if (msg instanceof EsiReturnedSellOrders) {
    let esi_response = msg[0];
    let location = msg.location;
    let page = msg.page;
    return esi_returned_sell_orders(
      model,
      esi_response,
      location,
      page
    );
  } else if (msg instanceof UserLoadedDestination) {
    let destination = msg.destination;
    return user_loaded_destination(model, destination);
  } else if (msg instanceof UserLoadedSource) {
    let source = msg.source;
    return user_loaded_source(model, source);
  } else if (msg instanceof UserClickedCopyMultibuy) {
    let multibuy = msg.multibuy;
    return user_clicked_copy_multibuy(model, multibuy);
  } else if (msg instanceof UserClickedComputeMultibuys) {
    return user_clicked_compute_multibuys(model);
  } else if (msg instanceof EsiReturnedTypeMetadata) {
    let esi_response = msg[0];
    return esi_returned_type_metadata(model, esi_response);
  } else if (msg instanceof UserClickedCollapseSidebar) {
    return user_clicked_collapse_sidebar(model);
  } else if (msg instanceof UserClickedExpandSidebar) {
    return user_clicked_expand_sidebar(model);
  } else if (msg instanceof UserUpdatedCollateral) {
    let value3 = msg.value;
    return user_updated_collateral(model, value3);
  } else if (msg instanceof UserUpdatedAccountingLevel) {
    let level = msg.level;
    return user_updated_accounting_level(model, level);
  } else if (msg instanceof UserCreatedShip) {
    return user_created_ship(model);
  } else if (msg instanceof UserDeletedShip) {
    let deleted_ship = msg.deleted_ship;
    return user_deleted_ship(model, deleted_ship);
  } else if (msg instanceof UserUpdatedShipName) {
    let id2 = msg.id;
    return user_updated_ship_name(model, id2);
  } else if (msg instanceof UserUpdatedShipHoldName) {
    let hold_id = msg.hold_id;
    let ship_id = msg.ship_id;
    return user_updated_ship_hold_name(model, hold_id, ship_id);
  } else if (msg instanceof UserUpdatedShipHoldCapacity) {
    let hold_id = msg.hold_id;
    let ship_id = msg.ship_id;
    return user_updated_ship_hold_capacity(model, hold_id, ship_id);
  } else if (msg instanceof UserUpdatedShipHoldKind) {
    let hold_kind = msg.kind;
    let hold_id = msg.hold_id;
    let ship_id = msg.ship_id;
    return user_updated_ship_hold_kind(
      model,
      hold_kind,
      hold_id,
      ship_id
    );
  } else if (msg instanceof UserAddedHoldToShip) {
    let ship_id = msg.ship_id;
    return user_added_hold_to_ship(model, ship_id);
  } else if (msg instanceof UserDeletedHoldFromShip) {
    let hold_id = msg.hold_id;
    let ship_id = msg.ship_id;
    return user_deleted_hold_from_ship(model, hold_id, ship_id);
  } else if (msg instanceof UserCollapsedShip) {
    let ship_id = msg.ship_id;
    return user_collapsed_ship(model, ship_id);
  } else if (msg instanceof UserExpandedShip) {
    let ship_id = msg.ship_id;
    return user_expanded_ship(model, ship_id);
  } else if (msg instanceof StoreWriteFailed) {
    let storage_key = msg.storage_key;
    let value3 = msg.value;
    return store_write_failed(model, storage_key, value3);
  } else if (msg instanceof InitStoreReadFailed) {
    let storage_key = msg.storage_key;
    return store_read_failed(model, storage_key);
  } else if (msg instanceof InitStoreReadShipName) {
    let name2 = msg.name;
    let id2 = msg.id;
    return store_read_ship_name(model, name2, id2);
  } else if (msg instanceof InitStoreReadAccountingLevel) {
    let accounting_level = msg.accounting_level;
    return store_read_accounting_level(model, accounting_level);
  } else if (msg instanceof InitStoreReadCollateral) {
    let collateral = msg.collateral;
    return store_read_collateral(model, collateral);
  } else if (msg instanceof InitStoreReadHoldCapacity) {
    let capacity = msg.capacity;
    let ship_id = msg.ship_id;
    let hold_id = msg.hold_id;
    return store_read_hold_capacity(model, capacity, ship_id, hold_id);
  } else if (msg instanceof InitStoreReadHoldIndices) {
    let hold_indices = msg.hold_indices;
    return store_read_hold_indices(model, hold_indices);
  } else if (msg instanceof InitStoreReadHoldKind) {
    let kind = msg.kind;
    let ship_id = msg.ship_id;
    let hold_id = msg.hold_id;
    return store_read_hold_kind(model, kind, ship_id, hold_id);
  } else if (msg instanceof InitStoreReadHoldName) {
    let name2 = msg.name;
    let ship_id = msg.ship_id;
    let hold_id = msg.hold_id;
    return store_read_hold_name(model, name2, ship_id, hold_id);
  } else if (msg instanceof InitLoadStorage) {
    let storage = msg.storage;
    return init_load_storage(model, storage);
  } else if (msg instanceof InitStoreLoadFailed) {
    return store_load_failed(model);
  } else {
    let ship_id = msg.selected_ship;
    return store_read_selected_ship(model, ship_id);
  }
}

// build/dev/javascript/lustre/lustre/element/svg.mjs
var namespace = "http://www.w3.org/2000/svg";
function svg(attrs, children) {
  return namespaced(namespace, "svg", attrs, children);
}
function path(attrs) {
  return namespaced(namespace, "path", attrs, empty_list);
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name2) {
  if (name2 === "input") {
    return true;
  } else if (name2 === "change") {
    return true;
  } else if (name2 === "focus") {
    return true;
  } else if (name2 === "focusin") {
    return true;
  } else if (name2 === "focusout") {
    return true;
  } else if (name2 === "blur") {
    return true;
  } else if (name2 === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name2, handler) {
  return event(
    name2,
    handler,
    empty_list,
    false,
    false,
    is_immediate_event(name2),
    new NoLimit(0)
  );
}
function on_click(msg) {
  return on("click", success(msg));
}
function on_input(msg) {
  return on(
    "input",
    subfield(
      toList(["target", "value"]),
      string2,
      (value3) => {
        return success(msg(value3));
      }
    )
  );
}
function on_blur(msg) {
  return on("blur", success(msg));
}

// build/dev/javascript/eve_arbitrage/mvu/view/multibuys.mjs
function get_active_compute_multibuys_button() {
  return div(
    toList([class$("flex justify-center my-8")]),
    toList([
      button(
        toList([
          class$(
            "bg-selected hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center transition-colors duration-200"
          ),
          on_click(new UserClickedComputeMultibuys())
        ]),
        toList([
          svg(
            toList([
              attribute2("stroke", "currentColor"),
              attribute2("viewBox", "0 0 24 24"),
              attribute2("fill", "none"),
              class$("h-5 w-5 mr-2"),
              attribute2("xmlns", "http://www.w3.org/2000/svg")
            ]),
            toList([
              path(
                toList([
                  attribute2(
                    "d",
                    "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ),
                  attribute2("stroke-width", "2"),
                  attribute2("stroke-linejoin", "round"),
                  attribute2("stroke-linecap", "round")
                ])
              )
            ])
          ),
          text3("Compute Multibuys\n                    ")
        ])
      )
    ])
  );
}
function get_inactive_compute_multibuys_button() {
  return div(
    toList([class$("flex justify-center my-8")]),
    toList([
      button(
        toList([
          class$(
            "bg-gray-400 text-gray-200 font-bold py-3 px-8 rounded-lg shadow-md flex items-center cursor-not-allowed"
          ),
          disabled(true)
        ]),
        toList([
          svg(
            toList([
              attribute2("stroke", "currentColor"),
              attribute2("viewBox", "0 0 24 24"),
              attribute2("fill", "none"),
              class$("h-5 w-5 mr-2"),
              attribute2("xmlns", "http://www.w3.org/2000/svg")
            ]),
            toList([
              path(
                toList([
                  attribute2(
                    "d",
                    "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ),
                  attribute2("stroke-width", "2"),
                  attribute2("stroke-linejoin", "round"),
                  attribute2("stroke-linecap", "round")
                ])
              )
            ])
          ),
          text3("Compute Multibuys\n                    ")
        ])
      )
    ])
  );
}
function get_compute_multibuy_button(selected_ship, collateral, source, destination) {
  if (selected_ship instanceof Some && collateral instanceof Some && source instanceof Some && destination instanceof Some) {
    return get_active_compute_multibuys_button();
  } else {
    return get_inactive_compute_multibuys_button();
  }
}
function get_multibuy(multibuy) {
  return div(
    toList([class$("mb-6")]),
    toList([
      div(
        toList([class$("relative bg-white rounded-t-lg shadow-md")]),
        toList([
          div(
            toList([class$("absolute top-3 right-3")]),
            toList([
              button(
                toList([
                  attribute2("title", "Copy to clipboard"),
                  class$("p-1 hover:bg-gray-100 rounded"),
                  on_click(new UserClickedCopyMultibuy(multibuy))
                ]),
                toList([
                  svg(
                    toList([
                      attribute2("stroke", "currentColor"),
                      attribute2("viewBox", "0 0 24 24"),
                      attribute2("fill", "none"),
                      class$("h-5 w-5 text-gray-500"),
                      attribute2("xmlns", "http://www.w3.org/2000/svg")
                    ]),
                    toList([
                      path(
                        toList([
                          attribute2(
                            "d",
                            "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          ),
                          attribute2("stroke-width", "2"),
                          attribute2("stroke-linejoin", "round"),
                          attribute2("stroke-linecap", "round")
                        ])
                      )
                    ])
                  )
                ])
              )
            ])
          ),
          div(
            toList([
              attribute2("aria-readonly", "true"),
              class$(
                "p-4 bg-gray-50 rounded-t-lg text-gray-700 font-mono text-sm h-24 overflow-y-auto"
              )
            ]),
            (() => {
              let _pipe = map2(
                get_multibuy_purchases(multibuy),
                (purchase) => {
                  return toList([
                    text3(purchase_to_string(purchase)),
                    br(toList([]))
                  ]);
                }
              );
              return flatten(_pipe);
            })()
          )
        ])
      ),
      div(
        toList([
          class$(
            "bg-white rounded-b-lg shadow-md p-3 border-t border-gray-200"
          )
        ]),
        toList([
          div(
            toList([class$("flex justify-between items-center")]),
            toList([
              span(
                toList([class$("font-medium text-gray-700")]),
                toList([text3("Total Price:")])
              ),
              span(
                toList([class$("font-bold text-gray-900")]),
                toList([
                  text3(
                    float_to_human_string(
                      get_multibuy_total_price(multibuy)
                    ) + " ISK"
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function get_section(model) {
  let _block;
  let _pipe = map2(
    model.trades,
    (trade) => {
      if (trade instanceof Multibuy2) {
        let multibuy = trade.multibuy;
        return new Ok(get_multibuy(multibuy));
      } else {
        return new Error(void 0);
      }
    }
  );
  let _pipe$1 = all2(_pipe);
  _block = unwrap2(_pipe$1, toList([]));
  let multibuys = _block;
  return section(
    toList([]),
    (() => {
      let _pipe$2 = toList([
        get_compute_multibuy_button(
          model.current_ship,
          model.collateral,
          model.source,
          model.destination
        ),
        h2(
          toList([class$("text-2xl font-bold mb-4")]),
          toList([text3("Arbitrage Multibuys")])
        )
      ]);
      return append(_pipe$2, multibuys);
    })()
  );
}

// build/dev/javascript/eve_arbitrage/mvu/view/sidebar/accounting.mjs
function get_section2(level) {
  let _block;
  let _pipe = level;
  _block = to_string(_pipe);
  let level_string = _block;
  let _block$1;
  let _pipe$1 = tax_percent_from_accounting_level(level);
  let _pipe$2 = to_precision(_pipe$1, 3);
  _block$1 = float_to_string(_pipe$2);
  let effective_tax_rate_string = _block$1;
  return div(
    toList([class$("p-4 border-b border-gray-200")]),
    toList([
      div(
        toList([class$("flex justify-between items-center mb-2")]),
        toList([
          label(
            toList([
              class$("block text-sm font-medium text-gray-700"),
              for$("accounting-level")
            ]),
            toList([text3("Accounting Level")])
          ),
          span(
            toList([class$("text-sm font-medium text-selected")]),
            toList([text3(level_string)])
          )
        ])
      ),
      div(
        toList([class$("relative mb-6")]),
        toList([
          input(
            toList([
              class$(
                "w-full h-1 bg-gray-200 rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-selected focus:ring-opacity-50"
              ),
              id("accounting-level"),
              step("1"),
              value(level_string),
              max("5"),
              min("0"),
              type_("range"),
              on_input(
                (input_string) => {
                  let $ = parse_int(input_string);
                  if (!$.isOk()) {
                    throw makeError(
                      "let_assert",
                      "mvu/view/sidebar/accounting",
                      44,
                      "",
                      "Pattern match failed, no pattern matched the value.",
                      { value: $ }
                    );
                  }
                  let level$1 = $[0];
                  return new UserUpdatedAccountingLevel(level$1);
                }
              )
            ])
          )
        ])
      ),
      div(
        toList([
          class$("flex justify-between text-xs text-gray-500 px-1")
        ]),
        toList([
          span(toList([]), toList([text3("0")])),
          span(toList([]), toList([text3("1")])),
          span(toList([]), toList([text3("2")])),
          span(toList([]), toList([text3("3")])),
          span(toList([]), toList([text3("4")])),
          span(toList([]), toList([text3("5")]))
        ])
      ),
      div(
        toList([class$("mt-2 text-xs text-gray-500")]),
        toList([
          span(toList([]), toList([text3("Effective tax rate: ")])),
          span(
            toList([class$("font-medium text-gray-700")]),
            toList([text3(effective_tax_rate_string + "%")])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/eve_arbitrage/mvu/view/sidebar/collateral.mjs
function get_empty_collateral() {
  return input(
    toList([
      placeholder("0"),
      step("1"),
      class$(
        "focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
      ),
      id("max-collateral"),
      name("max-collateral"),
      type_("number"),
      on_input(
        (_capture) => {
          return int_input_to_msg(
            _capture,
            (var0) => {
              return new UserUpdatedCollateral(var0);
            }
          );
        }
      )
    ])
  );
}
function get_set_collateral(value3) {
  return input(
    toList([
      placeholder("0"),
      class$(
        "focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
      ),
      id("max-collateral"),
      name("max-collateral"),
      type_("number"),
      value(
        (() => {
          let _pipe = value3;
          return to_string(_pipe);
        })()
      ),
      on_input(
        (input2) => {
          let _block;
          let _pipe = parse_int(input2);
          _block = from_result(_pipe);
          let value$1 = _block;
          return new UserUpdatedCollateral(value$1);
        }
      )
    ])
  );
}
function get_section3(collateral) {
  let _block;
  if (collateral instanceof None) {
    _block = get_empty_collateral();
  } else {
    let value3 = collateral[0];
    _block = get_set_collateral(value3);
  }
  let collateral_input = _block;
  return div(
    toList([class$("p-4 border-b border-gray-200")]),
    toList([
      label(
        toList([
          class$("block text-sm font-medium text-gray-700 mb-1"),
          for$("max-collateral")
        ]),
        toList([text3("Max Collateral")])
      ),
      div(
        toList([class$("relative rounded-md shadow-sm")]),
        toList([
          div(
            toList([
              class$(
                "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              )
            ]),
            toList([
              span(
                toList([class$("text-gray-500 sm:text-sm")]),
                toList([text3("ISK")])
              )
            ])
          ),
          collateral_input,
          div(
            toList([
              class$(
                "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              )
            ]),
            toList([
              span(
                toList([class$("text-gray-500 sm:text-sm")]),
                toList([text3("million")])
              )
            ])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/eve_arbitrage/mvu/view/sidebar/ships.mjs
var ShipStyle = class extends CustomType {
  constructor(container, header, name_input, capacity_text, arrow_icon) {
    super();
    this.container = container;
    this.header = header;
    this.name_input = name_input;
    this.capacity_text = capacity_text;
    this.arrow_icon = arrow_icon;
  }
};
function get_collapsed_ship(ship_id, ship, style) {
  let total_capacity_string = (() => {
    let _pipe = fold(
      (() => {
        let _pipe2 = ship.holds;
        return values(_pipe2);
      })(),
      0,
      (total, hold) => {
        return total + hold.capacity;
      }
    );
    return float_to_human_string(_pipe);
  })() + " m\xB3";
  return div(
    toList([class$(style.container)]),
    toList([
      div(
        toList([class$(style.header)]),
        toList([
          div(
            toList([
              class$(
                "pl-3 pt-3 pb-3 flex-grow flex items-center text-right"
              ),
              on_click(new UserSelectedShip(ship_id))
            ]),
            toList([
              span(
                toList([class$(style.name_input + " text-left")]),
                toList([text3(ship.name)])
              ),
              span(
                toList([class$(style.capacity_text)]),
                toList([text3(total_capacity_string)])
              )
            ])
          ),
          div(
            toList([
              class$("flex-shrink-0 pt-3 pb-3 pr-3"),
              on_click(new UserExpandedShip(ship_id))
            ]),
            toList([
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-5 w-5 ml-2"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg")
                ]),
                toList([
                  path(
                    toList([
                      attribute2("d", "M19 9l-7 7-7-7"),
                      attribute2("stroke-width", "2"),
                      attribute2("stroke-linejoin", "round"),
                      attribute2("stroke-linecap", "round")
                    ])
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function get_ship_hold(hold_id, hold, ship_id) {
  let name_element_id = "hold-name-" + to_string(hold_id);
  let capacity_element_id = "hold-capacity-" + to_string(hold_id);
  let _block;
  let _pipe = get_all_hold_kinds();
  _block = map2(
    _pipe,
    (hold_kind) => {
      let hold_kind_string = hold_kind_to_string(hold_kind);
      let hold_kind_id = lowercase(hold_kind_string);
      let $ = hold.kind;
      if (isEqual($, hold_kind)) {
        let k = $;
        return option(
          toList([value(hold_kind_id), selected(true)]),
          hold_kind_string
        );
      } else {
        return option(
          toList([value(hold_kind_id)]),
          hold_kind_string
        );
      }
    }
  );
  let hold_kinds = _block;
  return div(
    toList([class$("mb-3 p-3 bg-white rounded-md shadow-sm")]),
    toList([
      div(
        toList([class$("flex justify-between items-center mb-2")]),
        toList([
          input(
            toList([
              class$(
                "border border-gray-300 rounded-md px-2 py-1 text-sm w-1/2"
              ),
              id(name_element_id),
              value(hold.name),
              type_("text"),
              on_blur(new UserUpdatedShipHoldName(hold_id, ship_id))
            ])
          ),
          div(
            toList([class$("flex items-center")]),
            toList([
              input(
                toList([
                  class$(
                    "border border-gray-300 rounded-md px-2 py-1 text-sm w-20 mr-2"
                  ),
                  value(
                    (() => {
                      let _pipe$1 = hold.capacity;
                      return float_to_string(_pipe$1);
                    })()
                  ),
                  id(capacity_element_id),
                  type_("number"),
                  on_blur(
                    new UserUpdatedShipHoldCapacity(hold_id, ship_id)
                  )
                ])
              ),
              span(
                toList([class$("text-xs text-gray-500")]),
                toList([text3("m\xB3")])
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("flex items-center mt-2")]),
        toList([
          select(
            toList([
              class$(
                "border border-gray-300 rounded-md px-2 py-1 text-sm flex-grow"
              ),
              on_input(
                (_capture) => {
                  return new UserUpdatedShipHoldKind(
                    _capture,
                    hold_id,
                    ship_id
                  );
                }
              )
            ]),
            hold_kinds
          ),
          button(
            toList([
              attribute2("title", "Delete Hold"),
              class$(
                "ml-2 p-1 text-red-500 hover:bg-red-50 rounded-md"
              ),
              on_click(
                new UserDeletedHoldFromShip(hold_id, ship_id)
              )
            ]),
            toList([
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-4 w-4"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg")
                ]),
                toList([
                  path(
                    toList([
                      attribute2(
                        "d",
                        "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ),
                      attribute2("stroke-width", "2"),
                      attribute2("stroke-linejoin", "round"),
                      attribute2("stroke-linecap", "round")
                    ])
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function get_add_hold_button(ship_id) {
  return button(
    toList([
      class$(
        "flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 mb-3"
      ),
      on_click(new UserAddedHoldToShip(ship_id))
    ]),
    toList([
      svg(
        toList([
          attribute2("stroke", "currentColor"),
          attribute2("viewBox", "0 0 24 24"),
          attribute2("fill", "none"),
          class$("h-4 w-4 mr-1"),
          attribute2("xmlns", "http://www.w3.org/2000/svg")
        ]),
        toList([
          path(
            toList([
              attribute2("d", "M12 4v16m8-8H4"),
              attribute2("stroke-width", "2"),
              attribute2("stroke-linejoin", "round"),
              attribute2("stroke-linecap", "round")
            ])
          )
        ])
      ),
      text3("Add Hold\n                            ")
    ])
  );
}
function get_delete_ship_button(ship_id) {
  return button(
    toList([
      class$(
        "flex items-center justify-center w-full py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 hover:border-red-300 transition-colors"
      ),
      on_click(new UserDeletedShip(ship_id))
    ]),
    toList([
      svg(
        toList([
          attribute2("stroke", "currentColor"),
          attribute2("viewBox", "0 0 24 24"),
          attribute2("fill", "none"),
          class$("h-4 w-4 mr-1"),
          attribute2("xmlns", "http://www.w3.org/2000/svg")
        ]),
        toList([
          path(
            toList([
              attribute2(
                "d",
                "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ),
              attribute2("stroke-width", "2"),
              attribute2("stroke-linejoin", "round"),
              attribute2("stroke-linecap", "round")
            ])
          )
        ])
      ),
      text3("Delete Ship\n                            ")
    ])
  );
}
function get_expanded_ship(ship_id, ship, style) {
  let holds_buttons = toList([
    get_add_hold_button(ship_id),
    get_delete_ship_button(ship_id)
  ]);
  let _block;
  let _pipe = map_values(
    ship.holds,
    (hold_id, hold) => {
      return get_ship_hold(hold_id, hold, ship_id);
    }
  );
  _block = values(_pipe);
  let holds = _block;
  let total_capacity_string = (() => {
    let _pipe$1 = fold(
      (() => {
        let _pipe$12 = ship.holds;
        return values(_pipe$12);
      })(),
      0,
      (total, hold) => {
        return total + hold.capacity;
      }
    );
    return float_to_human_string(_pipe$1);
  })() + " m\xB3";
  let holds_content = append(holds, holds_buttons);
  let attribute_id = "ship-name-" + to_string(ship_id);
  return div(
    toList([class$(style.container)]),
    toList([
      div(
        toList([class$(style.header)]),
        toList([
          div(
            toList([
              class$(
                "pl-3 pt-3 pb-3 flex-grow flex items-center text-right"
              ),
              on_click(new UserSelectedShip(ship_id))
            ]),
            toList([
              input(
                toList([
                  class$(style.name_input + " border-b"),
                  id(attribute_id),
                  value(ship.name),
                  type_("text"),
                  on_blur(new UserUpdatedShipName(ship_id))
                ])
              ),
              span(
                toList([class$(style.capacity_text)]),
                toList([text3(total_capacity_string)])
              )
            ])
          ),
          div(
            toList([
              class$("pt-3 pb-3 pr-3 flex-shrink-0"),
              on_click(new UserCollapsedShip(ship_id))
            ]),
            toList([
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$(style.arrow_icon + " rotate-180"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg")
                ]),
                toList([
                  path(
                    toList([
                      attribute2("d", "M19 9l-7 7-7-7"),
                      attribute2("stroke-width", "2"),
                      attribute2("stroke-linejoin", "round"),
                      attribute2("stroke-linecap", "round")
                    ])
                  )
                ])
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("border-t border-gray-200")]),
        toList([div(toList([class$("p-3")]), holds_content)])
      )
    ])
  );
}
function get_add_ship_button() {
  return button(
    toList([
      class$(
        "flex items-center justify-center w-full py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50"
      ),
      on_click(new UserCreatedShip())
    ]),
    toList([
      svg(
        toList([
          attribute2("stroke", "currentColor"),
          attribute2("viewBox", "0 0 24 24"),
          attribute2("fill", "none"),
          class$("h-5 w-5 mr-1"),
          attribute2("xmlns", "http://www.w3.org/2000/svg")
        ]),
        toList([
          path(
            toList([
              attribute2("d", "M12 4v16m8-8H4"),
              attribute2("stroke-width", "2"),
              attribute2("stroke-linejoin", "round"),
              attribute2("stroke-linecap", "round")
            ])
          )
        ])
      ),
      text3("Add Ship\n                ")
    ])
  );
}
var default_ship_style = /* @__PURE__ */ new ShipStyle(
  "mb-3 border border-gray-200 rounded-md hover:border-gray-300",
  "bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100",
  "font-medium bg-transparent border-0 border-gray-300 focus:ring-0 focus:border-gray-500 px-0 py-0 w-24",
  "text-sm text-gray-600 mr-2 flex-grow",
  "h-5 w-5 ml-2"
);
var selected_ship_style = /* @__PURE__ */ new ShipStyle(
  "mb-3 border-2 border-selected rounded-md bg-indigo-50",
  "bg-indigo-100 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-indigo-200",
  "font-medium text-selected bg-transparent border-0 border-indigo-300 focus:ring-0 focus:border-selected px-0 py-0 w-24",
  "text-sm text-selected mr-2 flex-grow",
  "h-5 w-5 ml-2 text-selected"
);
function get_ship(ship_id, ship, is_selected) {
  let _block;
  if (!is_selected) {
    _block = default_ship_style;
  } else {
    _block = selected_ship_style;
  }
  let style = _block;
  let $ = ship.is_expanded;
  if (!$) {
    return get_collapsed_ship(ship_id, ship.ship, style);
  } else {
    return get_expanded_ship(ship_id, ship.ship, style);
  }
}
function get_section4(model) {
  let mapping_fn = (ship_id, ship_entry) => {
    let _block2;
    let $ = model.current_ship;
    if ($ instanceof Some && $[0] === ship_id) {
      let id2 = $[0];
      _block2 = true;
    } else {
      _block2 = false;
    }
    let is_selected = _block2;
    return get_ship(ship_id, ship_entry, is_selected);
  };
  let _block;
  let _pipe = map_values(model.ships, mapping_fn);
  _block = values(_pipe);
  let ships_contents = _block;
  let contents = prepend(
    h3(
      toList([class$("text-sm font-medium text-gray-700 mb-3")]),
      toList([text3("Ships")])
    ),
    append(ships_contents, toList([get_add_ship_button()]))
  );
  return div(toList([class$("p-4")]), contents);
}

// build/dev/javascript/eve_arbitrage/mvu/view/sidebar.mjs
function get_expanded_sidebar(model) {
  return aside(
    toList([
      class$(
        "fixed z-10 top-0 left-0 w-80 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "p-4 border-b border-gray-200 flex justify-between items-center"
          )
        ]),
        toList([
          h2(
            toList([class$("text-lg font-bold")]),
            toList([text3("Configuration")])
          ),
          button(
            toList([
              attribute2("title", "Toggle Sidebar"),
              class$("p-1 rounded-md hover:bg-gray-100"),
              on_click(new UserClickedCollapseSidebar())
            ]),
            toList([
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-6 w-6"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg")
                ]),
                toList([
                  path(
                    toList([
                      attribute2("d", "M11 19l-7-7 7-7m8 14l-7-7 7-7"),
                      attribute2("stroke-width", "2"),
                      attribute2("stroke-linejoin", "round"),
                      attribute2("stroke-linecap", "round")
                    ])
                  )
                ])
              )
            ])
          )
        ])
      ),
      get_section3(model.collateral),
      get_section2(model.accounting_level),
      get_section4(model)
    ])
  );
}
function get_ship_no_selected_icon() {
  return div(
    toList([class$("flex flex-col items-center")]),
    toList([
      div(
        toList([
          class$(
            "w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mb-1 text-gray-600 font-bold text-lg"
          )
        ]),
        toList([text3("\xD8\n                ")])
      ),
      span(
        toList([
          class$("text-xs font-medium text-gray-500 text-center")
        ]),
        toList([text3("No Ship Selected")])
      )
    ])
  );
}
function get_ship_selected_icon(ship_entry) {
  let total_capacity = fold2(
    ship_entry.ship.holds,
    0,
    (acc, _, hold) => {
      return acc + hold.capacity;
    }
  );
  let capacity_string = int_to_human_string(
    (() => {
      let _pipe2 = total_capacity;
      return truncate(_pipe2);
    })()
  ) + " m\xB3";
  let _block;
  let _pipe = ship_entry.ship.name;
  _block = pop_grapheme(_pipe);
  let $ = _block;
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/view/sidebar",
      246,
      "get_ship_selected_icon",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_letter_string = $[0][0];
  return div(
    toList([class$("flex flex-col items-center")]),
    toList([
      div(
        toList([
          class$(
            "w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md mb-1 text-white font-bold"
          )
        ]),
        toList([text3(ship_letter_string)])
      ),
      span(
        toList([class$("text-xs font-medium")]),
        toList([text3(capacity_string)])
      )
    ])
  );
}
function get_collapsed_sidebar(model) {
  let _block;
  let _pipe = model.collateral;
  _block = unwrap(_pipe, 0);
  let collateral = _block;
  let collateral_amount_string = millions_to_unit_string(collateral);
  let accounting_level_string = "LvL " + (() => {
    let _pipe$1 = model.accounting_level;
    return to_string(_pipe$1);
  })();
  let tax_rate_string = (() => {
    let _pipe$1 = tax_percent_from_accounting_level(
      model.accounting_level
    );
    let _pipe$2 = to_precision(_pipe$1, 3);
    return float_to_string(_pipe$2);
  })() + "%";
  let _block$1;
  let $ = model.current_ship;
  if ($ instanceof None) {
    _block$1 = get_ship_no_selected_icon();
  } else {
    let ship_id = $[0];
    let $1 = map_get(model.ships, ship_id);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/view/sidebar",
        92,
        "get_collapsed_sidebar",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let ship_entry = $1[0];
    _block$1 = get_ship_selected_icon(ship_entry);
  }
  let ship_icon = _block$1;
  return aside(
    toList([
      class$(
        "fixed top-0 left-0 w-16 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "p-4 border-b border-gray-200 flex justify-center items-center"
          )
        ]),
        toList([
          button(
            toList([
              attribute2("title", "Toggle Sidebar"),
              class$("p-1 rounded-md hover:bg-gray-100"),
              id("toggle-sidebar"),
              on_click(new UserClickedExpandSidebar())
            ]),
            toList([
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-6 w-6"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg")
                ]),
                toList([
                  path(
                    toList([
                      attribute2("d", "M13 5l7 7-7 7M5 5l7 7-7 7"),
                      attribute2("stroke-width", "2"),
                      attribute2("stroke-linejoin", "round"),
                      attribute2("stroke-linecap", "round")
                    ])
                  )
                ])
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("flex flex-col items-center pt-4 space-y-6")]),
        toList([
          div(
            toList([class$("flex flex-col items-center")]),
            toList([
              div(
                toList([
                  class$(
                    "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mb-1"
                  )
                ]),
                toList([
                  svg(
                    toList([
                      attribute2("stroke", "currentColor"),
                      attribute2("viewBox", "0 0 24 24"),
                      attribute2("fill", "none"),
                      class$("h-6 w-6 text-gray-600"),
                      attribute2("xmlns", "http://www.w3.org/2000/svg")
                    ]),
                    toList([
                      path(
                        toList([
                          attribute2(
                            "d",
                            "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          ),
                          attribute2("stroke-width", "2"),
                          attribute2("stroke-linejoin", "round"),
                          attribute2("stroke-linecap", "round")
                        ])
                      )
                    ])
                  )
                ])
              ),
              span(
                toList([class$("text-xs font-medium")]),
                toList([text3(collateral_amount_string)])
              )
            ])
          ),
          div(
            toList([class$("flex flex-col items-center")]),
            toList([
              div(
                toList([
                  class$(
                    "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mb-1"
                  )
                ]),
                toList([
                  svg(
                    toList([
                      attribute2("stroke", "currentColor"),
                      attribute2("viewBox", "0 0 24 24"),
                      attribute2("fill", "none"),
                      class$("h-6 w-6 text-gray-600"),
                      attribute2("xmlns", "http://www.w3.org/2000/svg")
                    ]),
                    toList([
                      path(
                        toList([
                          attribute2(
                            "d",
                            "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          ),
                          attribute2("stroke-width", "2"),
                          attribute2("stroke-linejoin", "round"),
                          attribute2("stroke-linecap", "round")
                        ])
                      )
                    ])
                  )
                ])
              ),
              span(
                toList([class$("text-xs font-medium text-selected")]),
                toList([text3(accounting_level_string)])
              ),
              span(
                toList([class$("text-[10px] text-gray-500")]),
                toList([text3(tax_rate_string)])
              )
            ])
          ),
          ship_icon
        ])
      )
    ])
  );
}
function get_section5(model) {
  let _block;
  let $ = model.sidebar_expanded;
  if (!$) {
    _block = get_collapsed_sidebar;
  } else {
    _block = get_expanded_sidebar;
  }
  return _block(model);
}

// build/dev/javascript/eve_arbitrage/mvu/view/systems_lists.mjs
function get_refresh_button(name2, is_source_system) {
  let _block;
  if (!is_source_system) {
    _block = (var0) => {
      return new UserLoadedDestination(var0);
    };
  } else {
    _block = (var0) => {
      return new UserLoadedSource(var0);
    };
  }
  let msg = _block;
  return button(
    toList([
      attribute2("title", "Reload item"),
      class$("p-1 hover:bg-gray-200 rounded"),
      on_click(msg(name2))
    ]),
    toList([
      svg(
        toList([
          attribute2("stroke", "currentColor"),
          attribute2("viewBox", "0 0 24 24"),
          attribute2("fill", "none"),
          class$("h-5 w-5 text-gray-500"),
          attribute2("xmlns", "http://www.w3.org/2000/svg")
        ]),
        toList([
          path(
            toList([
              attribute2(
                "d",
                "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ),
              attribute2("stroke-width", "2"),
              attribute2("stroke-linejoin", "round"),
              attribute2("stroke-linecap", "round")
            ])
          )
        ])
      )
    ])
  );
}
function get_download_button(name2, is_source_system) {
  let _block;
  if (!is_source_system) {
    _block = (var0) => {
      return new UserLoadedDestination(var0);
    };
  } else {
    _block = (var0) => {
      return new UserLoadedSource(var0);
    };
  }
  let msg = _block;
  return button(
    toList([
      attribute2("title", "Download data"),
      class$("p-1 hover:bg-gray-200 rounded"),
      on_click(msg(name2))
    ]),
    toList([
      svg(
        toList([
          attribute2("stroke", "currentColor"),
          attribute2("viewBox", "0 0 24 24"),
          attribute2("fill", "none"),
          class$("h-5 w-5 text-gray-500"),
          attribute2("xmlns", "http://www.w3.org/2000/svg")
        ]),
        toList([
          path(
            toList([
              attribute2(
                "d",
                "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ),
              attribute2("stroke-width", "2"),
              attribute2("stroke-linejoin", "round"),
              attribute2("stroke-linecap", "round")
            ])
          )
        ])
      )
    ])
  );
}
function get_empty_system(name2, system, is_source_system) {
  return li(
    toList([class$("p-4 border-b hover:bg-gray-50")]),
    toList([
      div(
        toList([class$("flex justify-between items-center")]),
        toList([
          span(
            toList([class$("text-gray-400")]),
            toList([text3(system.location.name)])
          ),
          get_download_button(name2, is_source_system)
        ])
      )
    ])
  );
}
function get_loading_button() {
  return div(
    toList([
      class$(
        "animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"
      )
    ]),
    toList([])
  );
}
function get_loading_system(_, system, _1) {
  return li(
    toList([class$("p-4 border-b hover:bg-gray-50")]),
    toList([
      div(
        toList([class$("flex justify-between items-center")]),
        toList([
          span(
            toList([class$("text-gray-600")]),
            toList([text3(system.location.name)])
          ),
          get_loading_button()
        ])
      )
    ])
  );
}
function get_orders_tag(amount, is_source_system, in_selected_system) {
  let _block;
  if (!is_source_system) {
    _block = int_to_human_string(amount) + " buy orders";
  } else {
    _block = int_to_human_string(amount) + " sell orders";
  }
  let orders_string = _block;
  let _block$1;
  if (!in_selected_system) {
    _block$1 = "bg-gray-200 text-gray-700 ";
  } else {
    _block$1 = "bg-selected text-white ";
  }
  let colors_classes = _block$1;
  return span(
    toList([
      class$(
        colors_classes + "ml-2 text-xs px-2 py-0.5 rounded-full"
      )
    ]),
    toList([text3(orders_string)])
  );
}
function get_selected_system(name2, system, is_source_system) {
  let _block;
  let $ = system.buy_orders_status;
  let $1 = system.sell_orders_status;
  if (is_source_system && $1 instanceof Loading) {
    _block = get_loading_button();
  } else if (is_source_system && $1 instanceof Loaded) {
    _block = get_refresh_button(name2, is_source_system);
  } else if (is_source_system && $1 instanceof Empty2) {
    throw makeError(
      "panic",
      "mvu/view/systems_lists",
      97,
      "get_selected_system",
      "should not be able to select an empty system",
      {}
    );
  } else if (!is_source_system && $ instanceof Loading) {
    _block = get_loading_button();
  } else if (!is_source_system && $ instanceof Loaded) {
    _block = get_refresh_button(name2, is_source_system);
  } else {
    throw makeError(
      "panic",
      "mvu/view/systems_lists",
      101,
      "get_selected_system",
      "should not be able to select an empty system",
      {}
    );
  }
  let button2 = _block;
  let _block$1;
  if (!is_source_system) {
    let _pipe = system.buy_orders;
    let _pipe$1 = length(_pipe);
    _block$1 = get_orders_tag(_pipe$1, is_source_system, true);
  } else {
    let _pipe = system.sell_orders;
    let _pipe$1 = length(_pipe);
    _block$1 = get_orders_tag(_pipe$1, is_source_system, true);
  }
  let orders_tag = _block$1;
  return li(
    toList([
      class$(
        "p-4 border-b hover:bg-gray-50 bg-indigo-50 border-l-4 border-l-selected"
      )
    ]),
    toList([
      div(
        toList([class$("flex justify-between items-center")]),
        toList([
          div(
            toList([class$("flex items-center")]),
            toList([
              span(
                toList([class$("text-selected font-medium")]),
                toList([text3(system.location.name)])
              ),
              orders_tag
            ])
          ),
          button2
        ])
      )
    ])
  );
}
function get_loaded_system(name2, system, is_source_system) {
  let _block;
  if (!is_source_system) {
    _block = (var0) => {
      return new UserSelectedDestination(var0);
    };
  } else {
    _block = (var0) => {
      return new UserSelectedSource(var0);
    };
  }
  let msg = _block;
  let _block$1;
  if (!is_source_system) {
    let _pipe = system.buy_orders;
    let _pipe$1 = length(_pipe);
    _block$1 = get_orders_tag(_pipe$1, is_source_system, false);
  } else {
    let _pipe = system.sell_orders;
    let _pipe$1 = length(_pipe);
    _block$1 = get_orders_tag(_pipe$1, is_source_system, false);
  }
  let orders_tag = _block$1;
  return li(
    toList([
      class$("p-4 border-b hover:bg-gray-50 cursor-pointer"),
      on_click(msg(name2))
    ]),
    toList([
      div(
        toList([class$("flex justify-between items-center")]),
        toList([
          div(
            toList([class$("flex items-center")]),
            toList([
              a(
                toList([
                  class$("block text-gray-800"),
                  href("#")
                ]),
                toList([text3(system.location.name), orders_tag])
              )
            ])
          ),
          get_refresh_button(name2, is_source_system)
        ])
      )
    ])
  );
}
function get_source_systems(systems, selected2) {
  let _pipe = map_values(systems, (name2, system) => {
    let _block;
    let $ = system.sell_orders_status;
    if (selected2 instanceof Some && selected2[0] === name2) {
      let selected_system = selected2[0];
      _block = get_selected_system;
    } else if ($ instanceof Empty2) {
      _block = get_empty_system;
    } else if ($ instanceof Loading) {
      _block = get_loading_system;
    } else {
      _block = get_loaded_system;
    }
    return _block(name2, system, true);
  });
  return values(_pipe);
}
function get_from_list(systems, selected2) {
  let systems_entries = get_source_systems(systems, selected2);
  return div(
    toList([class$("w-full md:w-1/2 bg-white rounded-lg shadow-md")]),
    toList([
      h3(
        toList([class$("p-4 font-semibold border-b")]),
        toList([text3("From")])
      ),
      ul(
        toList([class$("h-64 overflow-y-auto")]),
        systems_entries
      )
    ])
  );
}
function get_destination_systems(systems, selected2) {
  let _pipe = map_values(systems, (name2, system) => {
    let _block;
    let $ = system.buy_orders_status;
    if (selected2 instanceof Some && selected2[0] === name2) {
      let selected_system = selected2[0];
      _block = get_selected_system;
    } else if ($ instanceof Empty2) {
      _block = get_empty_system;
    } else if ($ instanceof Loading) {
      _block = get_loading_system;
    } else {
      _block = get_loaded_system;
    }
    return _block(name2, system, false);
  });
  return values(_pipe);
}
function get_to_list(systems, selected2) {
  let systems_entries = get_destination_systems(systems, selected2);
  return div(
    toList([class$("w-full md:w-1/2 bg-white rounded-lg shadow-md")]),
    toList([
      h3(
        toList([class$("p-4 font-semibold border-b")]),
        toList([text3("To")])
      ),
      ul(
        toList([class$("h-64 overflow-y-auto")]),
        systems_entries
      )
    ])
  );
}
function get_section6(model) {
  let from_list2 = get_from_list(model.systems, model.source);
  let to_list2 = get_to_list(model.systems, model.destination);
  return section(
    toList([class$("mb-10")]),
    toList([
      h2(
        toList([class$("text-2xl font-bold mb-4")]),
        toList([text3("Systems")])
      ),
      div(
        toList([class$("flex flex-col md:flex-row gap-6")]),
        toList([from_list2, to_list2])
      )
    ])
  );
}

// build/dev/javascript/eve_arbitrage/mvu/view.mjs
function run3(model) {
  let sidebar = get_section5(model);
  let systems_lists = get_section6(model);
  let multibuys = get_section(model);
  let page_contents = toList([systems_lists, multibuys]);
  let page = div(
    toList([class$("flex-1 overflow-auto pl-14")]),
    toList([
      div(
        toList([class$("max-w-6xl mx-auto p-8")]),
        page_contents
      )
    ])
  );
  return div(
    toList([class$("min-h-screen flex")]),
    toList([sidebar, page])
  );
}

// build/dev/javascript/eve_arbitrage/eve_arbitrage.mjs
var default_language = "en";
var default_accounting_level = 0;
function init(_) {
  let systems = fold(
    locations,
    new_map(),
    (systems2, _use1) => {
      let name2 = _use1[0];
      let location = _use1[1];
      let system = new System(
        location,
        toList([]),
        new Empty2(),
        toList([]),
        new Empty2()
      );
      return insert(systems2, name2, system);
    }
  );
  let effect = get_store();
  return [
    new Model(
      (() => {
        let _pipe = localStorage();
        return from_result(_pipe);
      })(),
      new_map(),
      new None(),
      0,
      0,
      systems,
      new None(),
      new None(),
      default_accounting_level,
      default_language,
      false,
      new None(),
      toList([])
    ),
    effect
  ];
}
function main() {
  let app = application(init, run2, run3);
  let $ = start3(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "eve_arbitrage",
      20,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
