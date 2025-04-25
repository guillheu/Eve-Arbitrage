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

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
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
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
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
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
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
      let $ = compare4(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse(growing$1), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse(growing$1), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse(growing$1), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
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
    let compare4 = loop$compare;
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
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
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
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
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
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
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
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return reverse(sequence);
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare4;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare4;
    }
  }
}
function sort(list4, compare4) {
  if (list4.hasLength(0)) {
    return toList([]);
  } else if (list4.hasLength(1)) {
    let x = list4.head;
    return toList([x]);
  } else {
    let x = list4.head;
    let y = list4.tail.head;
    let rest$1 = list4.tail.tail;
    let direction = (() => {
      let $ = compare4(x, y);
      if ($ instanceof Lt) {
        return new Ascending();
      } else if ($ instanceof Eq) {
        return new Ascending();
      } else {
        return new Descending();
      }
    })();
    let sequences$1 = sequences(
      rest$1,
      compare4,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare4);
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

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string5, pattern, substitute) {
  let _pipe = string5;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
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
function map2(result, fun) {
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
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string5) {
  return string5.toLowerCase();
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
function insert(dict2, key, value3) {
  return map_insert(key, value3, dict2);
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
function values(dict2) {
  let list_of_pairs = map_to_list(dict2);
  return do_values_loop(list_of_pairs, toList([]));
}
function delete$(dict2, key) {
  return map_remove(key, dict2);
}
function upsert(dict2, key, fun) {
  let $ = map_get(dict2, key);
  if ($.isOk()) {
    let value3 = $[0];
    return insert(dict2, key, fun(new Some(value3)));
  } else {
    return insert(dict2, key, fun(new None()));
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
function fold2(dict2, initial, fun) {
  return fold_loop(map_to_list(dict2), initial, fun);
}
function do_map_values(f, dict2) {
  let f$1 = (dict3, k, v) => {
    return insert(dict3, k, f(k, v));
  };
  return fold2(dict2, new_map(), f$1);
}
function map_values(dict2, fun) {
  return do_map_values(fun, dict2);
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
function map3(decoder, transformer) {
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
var bool = /* @__PURE__ */ new Decoder(decode_bool2);
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
var float2 = /* @__PURE__ */ new Decoder(decode_float2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string2);
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
        return map3(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
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
  let errors = map(
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
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$() {
  return new Set2(new_map());
}
function contains(set, member) {
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
function compare3(a2, b) {
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
      return compare3(b, a2);
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
function to_string2(path2) {
  return do_to_string(path2, toList([]));
}
function matches(path2, candidates) {
  if (candidates.hasLength(0)) {
    return false;
  } else {
    return do_matches(to_string2(path2), candidates);
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
      let new_node = (() => {
        let _record = node;
        return new Fragment(
          _record.kind,
          _record.key,
          _record.mapper,
          node_children,
          node_keyed_children,
          _record.children_count
        );
      })();
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
      let $ = compare3(prev, next);
      if (prev instanceof Attribute && $ instanceof Eq && next instanceof Attribute) {
        let has_changes = (() => {
          let $1 = next.name;
          if ($1 === "value") {
            return controlled || prev.value !== next.value;
          } else if ($1 === "checked") {
            return controlled || prev.value !== next.value;
          } else if ($1 === "selected") {
            return controlled || prev.value !== next.value;
          } else {
            return prev.value !== next.value;
          }
        })();
        let added$1 = (() => {
          if (has_changes) {
            return prepend(next, added);
          } else {
            return added;
          }
        })();
        loop$controlled = controlled;
        loop$path = path2;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Property && $ instanceof Eq && next instanceof Property) {
        let has_changes = (() => {
          let $1 = next.name;
          if ($1 === "scrollLeft") {
            return true;
          } else if ($1 === "scrollRight") {
            return true;
          } else if ($1 === "value") {
            return controlled || !isEqual(prev.value, next.value);
          } else if ($1 === "checked") {
            return controlled || !isEqual(prev.value, next.value);
          } else if ($1 === "selected") {
            return controlled || !isEqual(prev.value, next.value);
          } else {
            return !isEqual(prev.value, next.value);
          }
        })();
        let added$1 = (() => {
          if (has_changes) {
            return prepend(next, added);
          } else {
            return added;
          }
        })();
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
        let added$1 = (() => {
          if (has_changes) {
            return prepend(next, added);
          } else {
            return added;
          }
        })();
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
      let removed$1 = (() => {
        let $ = prev.key === "" || !contains(moved, prev.key);
        if ($) {
          return removed + advance(prev);
        } else {
          return removed;
        }
      })();
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
      let prev_has_moved = contains(moved, prev.key);
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
        let events$1 = (() => {
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path2, node_index, prev);
          return add_child(_pipe$1, mapper, path2, node_index, next);
        })();
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
      let changes$1 = (() => {
        let $ = child.patch.removed > 0;
        if ($) {
          let remove_from = node_index$1 + next_count - moved_offset;
          let patch = remove2(remove_from, child.patch.removed);
          return append(child.patch.changes, prepend(patch, changes));
        } else {
          return append(child.patch.changes, changes);
        }
      })();
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
      let initial_child_changes = (() => {
        if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
          return empty_list;
        } else {
          return toList([update(added_attrs, removed_attrs)]);
        }
      })();
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
      let children$1 = (() => {
        let $1 = child.patch;
        if ($1 instanceof Patch && $1.removed === 0 && $1.changes.hasLength(0) && $1.children.hasLength(0)) {
          return children;
        } else {
          return prepend(child.patch, children);
        }
      })();
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
      let child_changes = (() => {
        if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
          return empty_list;
        } else {
          return toList([update(added_attrs, removed_attrs)]);
        }
      })();
      let child_changes$1 = (() => {
        let $1 = prev.inner_html === next.inner_html;
        if ($1) {
          return child_changes;
        } else {
          return prepend(
            replace_inner_html(next.inner_html),
            child_changes
          );
        }
      })();
      let children$1 = (() => {
        if (child_changes$1.hasLength(0)) {
          return children;
        } else {
          return prepend(
            new$4(node_index, 0, child_changes$1, toList([])),
            children
          );
        }
      })();
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
      let events$1 = (() => {
        let _pipe = events;
        let _pipe$1 = remove_child(_pipe, path2, node_index, prev);
        return add_child(_pipe$1, mapper, path2, node_index, next);
      })();
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
    const empty5 = empty_text_node();
    initialiseMetadata(empty5);
    root3.appendChild(empty5);
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
  let events$1 = (() => {
    let _record = events;
    return new Events(
      _record.handlers,
      _record.dispatched_paths,
      next_dispatched_paths
    );
  })();
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
    map3(handler, identity2(mapper))
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

// build/dev/javascript/eve_arbitrage/arbitrage.mjs
var Multibuy = class extends CustomType {
  constructor(purchases, total_price) {
    super();
    this.purchases = purchases;
    this.total_price = total_price;
  }
};
var Purchase = class extends CustomType {
  constructor(item_name, amount, unit_price, total_price) {
    super();
    this.item_name = item_name;
    this.amount = amount;
    this.unit_price = unit_price;
    this.total_price = total_price;
  }
};
function multibuy_from_purchases(purchases) {
  return new Multibuy(
    purchases,
    fold(
      purchases,
      0,
      (total, purchase) => {
        return total + purchase.total_price;
      }
    )
  );
}
function new_purchase(name2, amount, unit_price) {
  return new Purchase(
    name2,
    amount,
    unit_price,
    unit_price * (() => {
      let _pipe = amount;
      return identity(_pipe);
    })()
  );
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
  let _pipe = map(
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
      })();
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path2,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path2,
          _record.query,
          _record.fragment
        );
      })();
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
      let pieces$1 = (() => {
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
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
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
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = (() => {
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
      })();
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size2 === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
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
    let pieces$1 = (() => {
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
    })();
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
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
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size2 === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size2 === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size2);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
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
function to_string4(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment3 = $[0];
      return toList(["#", fragment3]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat2(parts$5);
}
var empty4 = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty4, 0);
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
  let url = to_string4(to_uri(request));
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
  let _pipe = (() => {
    if (uri_string.startsWith("./")) {
      return from_relative_url(uri_string);
    } else if (uri_string.startsWith("/")) {
      return from_relative_url(uri_string);
    } else {
      return parse2(uri_string);
    }
  })();
  return replace_error(_pipe, new BadUrl(uri_string));
}
function get2(url, handler) {
  let $ = to_uri2(url);
  if ($.isOk()) {
    let uri = $[0];
    let _pipe = from_uri(uri);
    let _pipe$1 = map2(
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
                59,
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
                90,
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
var esi_url = "https://esi.evetech.net/latest";
var market_order_url = "/markets/{region_id}/orders/?datasource=tranquility&order_type={order_kind}&page={page}";
function get_market_orders_url(from2, is_buy_order, page) {
  let order_kind = (() => {
    if (!is_buy_order) {
      return "sell";
    } else {
      return "buy";
    }
  })();
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

// build/dev/javascript/eve_arbitrage/mvu.mjs
var Model = class extends CustomType {
  constructor(ships, current_ship, count_ship_index, count_hold_index, systems, source, destination, accounting_level, language, sidebar_expanded, collateral, multibuys) {
    super();
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
    this.multibuys = multibuys;
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
  constructor(selected_ship) {
    super();
    this.selected_ship = selected_ship;
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
function int_input_to_msg(input2, msg) {
  let value3 = (() => {
    let _pipe = parse_int(input2);
    return from_result(_pipe);
  })();
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

// build/dev/javascript/eve_arbitrage/mvu/update/multibuys.mjs
function user_clicked_copy_multibuy(model, multibuy) {
  let multibuy_text = multibuy_to_string(multibuy);
  let side_effect = write(multibuy_text);
  console_log("Multibuy copied to clipboard");
  return [model, side_effect];
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
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  let side_effect = none();
  console_log(
    "Ship #" + (() => {
      let _pipe = selected_ship;
      return to_string(_pipe);
    })() + " selected"
  );
  return [model$1, side_effect];
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
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_deleted_ship(model, deleted_ship) {
  let ships = delete$(model.ships, deleted_ship);
  let model$1 = (() => {
    let _record = model;
    return new Model(
      ships,
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_updated_ship_hold_kind(model, hold_kind, hold_id, ship_id) {
  let $ = hold_kind_from_string(hold_kind);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      135,
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
      136,
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
      138,
      "user_updated_ship_hold_kind",
      "Pattern match failed, no pattern matched the value.",
      { value: $2 }
    );
  }
  let hold = $2[0];
  let hold$1 = (() => {
    let _record = hold;
    return new Hold(_record.name, hold_kind$1, _record.capacity);
  })();
  let holds = insert(ship.holds, hold_id, hold$1);
  let ship$1 = (() => {
    let _record = ship;
    return new Ship(_record.name, holds);
  })();
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(ship$1, _record.is_expanded);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_added_hold_to_ship(model, ship_id) {
  let new_hold = new Hold("New Hold", new Generic(), 100);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      153,
      "user_added_hold_to_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship = ship_entry.ship;
  let holds = insert(ship.holds, model.count_hold_index, new_hold);
  let ship$1 = (() => {
    let _record = ship;
    return new Ship(_record.name, holds);
  })();
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(ship$1, _record.is_expanded);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
      ship_entries,
      _record.current_ship,
      _record.count_ship_index,
      model.count_hold_index + 1,
      _record.systems,
      _record.source,
      _record.destination,
      _record.accounting_level,
      _record.language,
      _record.sidebar_expanded,
      _record.collateral,
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_deleted_hold_from_ship(model, hold_id, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      173,
      "user_deleted_hold_from_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let holds = delete$(ship_entry.ship.holds, hold_id);
  let ship = (() => {
    let _record = ship_entry.ship;
    return new Ship(_record.name, holds);
  })();
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(ship, _record.is_expanded);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_collapsed_ship(model, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      186,
      "user_collapsed_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(_record.ship, false);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_expanded_ship(model, ship_id) {
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      197,
      "user_expanded_ship",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let ship_entry = $[0];
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(_record.ship, true);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
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
      68,
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
  let model$1 = (() => {
    let $1 = map_get(model.ships, id2);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/ships",
        75,
        "user_updated_ship_name",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let ship_entry = $1[0];
    let ship$1 = ship_entry.ship;
    let ship$2 = (() => {
      let _record2 = ship$1;
      return new Ship(name2, _record2.holds);
    })();
    let ship_entry$1 = (() => {
      let _record2 = ship_entry;
      return new ShipEntry(ship$2, _record2.is_expanded);
    })();
    let _record = model;
    return new Model(
      insert(model.ships, id2, ship_entry$1),
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_updated_ship_hold_name(model, hold_id, ship_id) {
  let element_id = "hold-name-" + to_string(hold_id);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      90,
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
      92,
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
  let hold$1 = (() => {
    let _record = hold;
    return new Hold(name2, _record.kind, _record.capacity);
  })();
  let holds = insert(ship.holds, hold_id, hold$1);
  let new_ship = (() => {
    let _record = ship;
    return new Ship(_record.name, holds);
  })();
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(new_ship, _record.is_expanded);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
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
  let int_parse_result = (() => {
    let _pipe = try$(value_result, parse_int);
    return map2(_pipe, identity);
  })();
  let value_result$1 = (() => {
    let _pipe = float_parse_result;
    return or(_pipe, int_parse_result);
  })();
  return unwrap2(value_result$1, default_value);
}
function user_updated_ship_hold_capacity(model, hold_id, ship_id) {
  let element_id = "hold-capacity-" + to_string(hold_id);
  let $ = map_get(model.ships, ship_id);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "mvu/update/ships",
      111,
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
      113,
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
  let hold$1 = (() => {
    let _record = hold;
    return new Hold(_record.name, _record.kind, capacity);
  })();
  let holds = insert(ship.holds, hold_id, hold$1);
  let new_ship = (() => {
    let _record = ship;
    return new Ship(_record.name, holds);
  })();
  let ship_entry$1 = (() => {
    let _record = ship_entry;
    return new ShipEntry(new_ship, _record.is_expanded);
  })();
  let ship_entries = insert(model.ships, ship_id, ship_entry$1);
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}

// build/dev/javascript/eve_arbitrage/mvu/update/sidebar.mjs
function user_clicked_collapse_sidebar(model) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_clicked_expand_sidebar(model) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_updated_collateral(model, value3) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}
function user_updated_accounting_level(model, level) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  return [model$1, none()];
}

// build/dev/javascript/eve_arbitrage/mvu/update/side_effects/fetch_orders.mjs
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

// build/dev/javascript/eve_arbitrage/mvu/update/systems.mjs
function user_selected_source(new_source, model) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
  let side_effect = none();
  console_log("Source " + new_source + " selected");
  return [model$1, side_effect];
}
function user_selected_destination(new_dest, model) {
  let model$1 = (() => {
    let _record = model;
    return new Model(
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
      _record.multibuys
    );
  })();
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
    let system$2 = (() => {
      let _record = system$1;
      return new System(
        _record.location,
        _record.buy_orders,
        _record.buy_orders_status,
        _record.sell_orders,
        new Loaded(system_time2())
      );
    })();
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
    let model$1 = (() => {
      let _record = model;
      return new Model(
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
        _record.multibuys
      );
    })();
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
              80,
              "",
              "system " + from2 + " should be present",
              {}
            );
          }
        );
        let _record = system2;
        return new System(
          _record.location,
          _record.buy_orders,
          _record.buy_orders_status,
          (() => {
            let _pipe = system2.sell_orders;
            return append(_pipe, orders);
          })(),
          _record.sell_orders_status
        );
      }
    );
    let $ = map_get(model.systems, from2);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "mvu/update/systems",
        87,
        "esi_returned_sell_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let system = $[0];
    console_log(
      "Fetched " + from2 + " sell orders page " + to_string(page)
    );
    return [
      (() => {
        let _record = model;
        return new Model(
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
          _record.multibuys
        );
      })(),
      get_query_sell_orders_side_effect(
        system.location,
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
        116,
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
        120,
        "esi_returned_buy_orders",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let system$1 = $1[0];
    let system$2 = (() => {
      let _record = system$1;
      return new System(
        _record.location,
        _record.buy_orders,
        new Loaded(system_time2()),
        _record.sell_orders,
        _record.sell_orders_status
      );
    })();
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
              130,
              "",
              "system " + from2 + " should be present",
              {}
            );
          }
        );
        return system$2;
      }
    );
    let model$1 = (() => {
      let _record = model;
      return new Model(
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
        _record.multibuys
      );
    })();
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
              146,
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
        153,
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
          _record.multibuys
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
      173,
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
  let system$1 = (() => {
    let _record = system;
    return new System(
      _record.location,
      _record.buy_orders,
      _record.buy_orders_status,
      toList([]),
      new Loading()
    );
  })();
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
            181,
            "",
            "did not find system " + from2,
            {}
          );
        }
      );
      return system$1;
    }
  );
  let model$1 = (() => {
    let $1 = model.source;
    if ($1 instanceof Some && $1[0] === from2) {
      let current_source = $1[0];
      let _record = model;
      return new Model(
        _record.ships,
        _record.current_ship,
        _record.count_ship_index,
        _record.count_hold_index,
        _record.systems,
        new None(),
        _record.destination,
        _record.accounting_level,
        _record.language,
        _record.sidebar_expanded,
        _record.collateral,
        _record.multibuys
      );
    } else {
      return model;
    }
  })();
  return [
    (() => {
      let _record = model$1;
      return new Model(
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
        _record.multibuys
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
      197,
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
  let system$1 = (() => {
    let _record = system;
    return new System(
      _record.location,
      toList([]),
      new Loading(),
      _record.sell_orders,
      _record.sell_orders_status
    );
  })();
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
            205,
            "",
            "did not find system " + to,
            {}
          );
        }
      );
      return system$1;
    }
  );
  let model$1 = (() => {
    let $1 = model.destination;
    if ($1 instanceof Some && $1[0] === to) {
      let current_destination = $1[0];
      let _record = model;
      return new Model(
        _record.ships,
        _record.current_ship,
        _record.count_ship_index,
        _record.count_hold_index,
        _record.systems,
        _record.source,
        new None(),
        _record.accounting_level,
        _record.language,
        _record.sidebar_expanded,
        _record.collateral,
        _record.multibuys
      );
    } else {
      return model;
    }
  })();
  return [
    (() => {
      let _record = model$1;
      return new Model(
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
        _record.multibuys
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
    let selected_ship = msg.selected_ship;
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
  } else {
    let ship_id = msg.ship_id;
    return user_expanded_ship(model, ship_id);
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
function int_to_human_string(from2) {
  let $ = divideInt(from2, 1e3);
  if ($ > 10) {
    let thousands = $;
    return to_string(thousands) + "k";
  } else {
    return to_string(from2);
  }
}

// build/dev/javascript/eve_arbitrage/mvu/view/multibuys.mjs
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
              let _pipe = map(
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
  return section(
    toList([]),
    (() => {
      let _pipe = toList([
        h2(
          toList([class$("text-2xl font-bold mb-4")]),
          toList([text3("Arbitrage Multibuys")])
        )
      ]);
      return append(_pipe, map(model.multibuys, get_multibuy));
    })()
  );
}

// build/dev/javascript/eve_arbitrage/mvu/view/sidebar/accounting.mjs
function get_section2(level) {
  let level_string = (() => {
    let _pipe = level;
    return to_string(_pipe);
  })();
  let effective_tax_rate_string = (() => {
    let _pipe = tax_percent_from_accounting_level(level);
    let _pipe$1 = to_precision(_pipe, 3);
    return float_to_string(_pipe$1);
  })();
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
          let value$1 = (() => {
            let _pipe = parse_int(input2);
            return from_result(_pipe);
          })();
          return new UserUpdatedCollateral(value$1);
        }
      )
    ])
  );
}
function get_section3(collateral) {
  let collateral_input = (() => {
    if (collateral instanceof None) {
      return get_empty_collateral();
    } else {
      let value3 = collateral[0];
      return get_set_collateral(value3);
    }
  })();
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
function get_collapsed_ship(ship_id, ship) {
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
    toList([
      class$(
        "mb-3 border border-gray-200 rounded-md hover:border-gray-300"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "p-3 bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100"
          )
        ]),
        toList([
          span(
            toList([class$("font-medium")]),
            toList([text3(ship.name)])
          ),
          div(
            toList([class$("flex items-center")]),
            toList([
              span(
                toList([class$("text-sm text-gray-600 mr-2")]),
                toList([text3(total_capacity_string)])
              ),
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-5 w-5 ml-2"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg"),
                  on_click(new UserExpandedShip(ship_id))
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
  let hold_kinds = (() => {
    let _pipe = get_all_hold_kinds();
    return map(
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
  })();
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
                      let _pipe = hold.capacity;
                      return float_to_string(_pipe);
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
function get_expanded_ship(ship_id, ship) {
  let holds_buttons = toList([
    get_add_hold_button(ship_id),
    get_delete_ship_button(ship_id)
  ]);
  let holds = (() => {
    let _pipe = map_values(
      ship.holds,
      (hold_id, hold) => {
        return get_ship_hold(hold_id, hold, ship_id);
      }
    );
    return values(_pipe);
  })();
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
  let holds_content = append(holds, holds_buttons);
  let attribute_id = "ship-name-" + to_string(ship_id);
  return div(
    toList([
      class$(
        "mb-3 border border-gray-200 rounded-md hover:border-gray-300"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "p-3 bg-gray-50 rounded-t-md flex justify-between items-center cursor-pointer hover:bg-gray-100"
          )
        ]),
        toList([
          input(
            toList([
              class$(
                "font-medium bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-gray-500 px-0 py-0 w-24"
              ),
              id(attribute_id),
              value(ship.name),
              type_("text"),
              on_blur(new UserUpdatedShipName(ship_id))
            ])
          ),
          div(
            toList([class$("flex items-center")]),
            toList([
              span(
                toList([class$("text-sm text-gray-600 mr-2")]),
                toList([text3(total_capacity_string)])
              ),
              svg(
                toList([
                  attribute2("stroke", "currentColor"),
                  attribute2("viewBox", "0 0 24 24"),
                  attribute2("fill", "none"),
                  class$("h-5 w-5 ml-2 rotate-180"),
                  attribute2("xmlns", "http://www.w3.org/2000/svg"),
                  on_click(new UserCollapsedShip(ship_id))
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
        toList([
          class$(
            "collapsible-content demo-expanded border-t border-gray-200"
          )
        ]),
        toList([div(toList([class$("p-3")]), holds_content)])
      )
    ])
  );
}
function get_ship(ship_id, ship) {
  let $ = ship.is_expanded;
  if (!$) {
    return get_collapsed_ship(ship_id, ship.ship);
  } else {
    return get_expanded_ship(ship_id, ship.ship);
  }
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
function get_section4(model) {
  let ships_contents = (() => {
    let _pipe = map_values(model.ships, get_ship);
    return values(_pipe);
  })();
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
        "w-80 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200"
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
function get_collapsed_sidebar(_) {
  return aside(
    toList([
      class$(
        "w-12 bg-white shadow-lg h-screen flex-shrink-0 border-r border-gray-200 flex flex-col items-center"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "p-3 border-b border-gray-200 w-full flex justify-center"
          )
        ]),
        toList([
          button(
            toList([
              attribute2("title", "Expand Sidebar"),
              class$("p-1 rounded-md hover:bg-gray-100 tooltip"),
              id("toggle-sidebar"),
              on_click(new UserClickedExpandSidebar())
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
      )
    ])
  );
}
function get_section5(model) {
  return (() => {
    let $ = model.sidebar_expanded;
    if (!$) {
      return get_collapsed_sidebar;
    } else {
      return get_expanded_sidebar;
    }
  })()(model);
}

// build/dev/javascript/eve_arbitrage/mvu/view/systems_lists.mjs
function get_refresh_button(name2, is_source_system) {
  let msg = (() => {
    if (!is_source_system) {
      return (var0) => {
        return new UserLoadedDestination(var0);
      };
    } else {
      return (var0) => {
        return new UserLoadedSource(var0);
      };
    }
  })();
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
  let msg = (() => {
    if (!is_source_system) {
      return (var0) => {
        return new UserLoadedDestination(var0);
      };
    } else {
      return (var0) => {
        return new UserLoadedSource(var0);
      };
    }
  })();
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
  let orders_string = (() => {
    if (!is_source_system) {
      return int_to_human_string(amount) + " buy orders";
    } else {
      return int_to_human_string(amount) + " sell orders";
    }
  })();
  let colors_classes = (() => {
    if (!in_selected_system) {
      return "bg-gray-200 text-gray-700 ";
    } else {
      return "bg-selected text-white ";
    }
  })();
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
  let button2 = (() => {
    let $ = system.buy_orders_status;
    let $1 = system.sell_orders_status;
    if (is_source_system && $1 instanceof Loading) {
      return get_loading_button();
    } else if (is_source_system && $1 instanceof Loaded) {
      return get_refresh_button(name2, is_source_system);
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
      return get_loading_button();
    } else if (!is_source_system && $ instanceof Loaded) {
      return get_refresh_button(name2, is_source_system);
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
  })();
  let orders_tag = (() => {
    if (!is_source_system) {
      let _pipe = system.buy_orders;
      let _pipe$1 = length(_pipe);
      return get_orders_tag(_pipe$1, is_source_system, true);
    } else {
      let _pipe = system.sell_orders;
      let _pipe$1 = length(_pipe);
      return get_orders_tag(_pipe$1, is_source_system, true);
    }
  })();
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
  let msg = (() => {
    if (!is_source_system) {
      return (var0) => {
        return new UserSelectedDestination(var0);
      };
    } else {
      return (var0) => {
        return new UserSelectedSource(var0);
      };
    }
  })();
  let orders_tag = (() => {
    if (!is_source_system) {
      let _pipe = system.buy_orders;
      let _pipe$1 = length(_pipe);
      return get_orders_tag(_pipe$1, is_source_system, false);
    } else {
      let _pipe = system.sell_orders;
      let _pipe$1 = length(_pipe);
      return get_orders_tag(_pipe$1, is_source_system, false);
    }
  })();
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
  let _pipe = map_values(
    systems,
    (name2, system) => {
      return (() => {
        let $ = system.sell_orders_status;
        if (selected2 instanceof Some && selected2[0] === name2) {
          let selected_system = selected2[0];
          return get_selected_system;
        } else if ($ instanceof Empty2) {
          return get_empty_system;
        } else if ($ instanceof Loading) {
          return get_loading_system;
        } else {
          return get_loaded_system;
        }
      })()(name2, system, true);
    }
  );
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
  let _pipe = map_values(
    systems,
    (name2, system) => {
      return (() => {
        let $ = system.buy_orders_status;
        if (selected2 instanceof Some && selected2[0] === name2) {
          let selected_system = selected2[0];
          return get_selected_system;
        } else if ($ instanceof Empty2) {
          return get_empty_system;
        } else if ($ instanceof Loading) {
          return get_loading_system;
        } else {
          return get_loaded_system;
        }
      })()(name2, system, false);
    }
  );
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
    toList([class$("flex-1 overflow-auto")]),
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
  let debug_multibuys = toList([
    (() => {
      let _pipe = toList([
        new_purchase("Heavy Water", 112764, 120.8),
        new_purchase("Iteron Mark V Lodestrike SKIN", 1, 86500)
      ]);
      return multibuy_from_purchases(_pipe);
    })(),
    (() => {
      let _pipe = toList([
        new_purchase("Heavy Water", 112764, 120.8)
      ]);
      return multibuy_from_purchases(_pipe);
    })(),
    (() => {
      let _pipe = toList([
        new_purchase("Heavy Water", 112764, 120.8)
      ]);
      return multibuy_from_purchases(_pipe);
    })()
  ]);
  return [
    new Model(
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
      debug_multibuys
    ),
    none()
  ];
}
function main() {
  let app = application(init, run2, run3);
  let $ = start3(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "eve_arbitrage",
      18,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
