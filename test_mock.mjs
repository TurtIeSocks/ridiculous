const writeText = (() => {
  let count = 0
  return () => {
    count++
    console.log("writeText called, count:", count)
    return Promise.resolve()
  }
})()

Object.defineProperty(navigator, "clipboard", {
  value: { writeText },
  configurable: true,
})

console.log("clipboard writeText:", navigator.clipboard.writeText)
navigator.clipboard.writeText("test").then(() => {
  console.log("promise resolved")
})

console.log("done setting up")
