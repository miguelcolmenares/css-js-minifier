function test() {
  var input = "Hello, World!";
  var output = "";
  for (var i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) + 1);
  }
  return output;
}