// Import frameworks
const axios = require('axios')
const xpath = require('xpath'), dom = require('xmldom').DOMParser

let xml = "<book author='J. K. Rowling'><title>Harry Potter</title></book>"
let doc = new dom().parseFromString(xml)
let author = xpath.select1("/book/@author", doc).value
 
console.log(author)