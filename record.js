// Import frameworks
const axios = require('axios')
const xpath = require('xpath'), dom = require('xmldom').DOMParser

module.exports = 

async function record(token, level) {
  if (typeof (level) == String) {
    level = level.toLowerCase().replace(/ /g, '')
  }
  let diff = 0
  switch (level) {
    case 'basic':
    case 0:
      break
    case 'advanced':
    case 1:
      diff = 1
      break
    case 'expert':
    case 2:
      diff = 2
      break
    case 'master':
    case 3:
      diff = 3
      break
    case 're:master':
    case 4:
      diff = 4
      break
    case 'all':
    case 99:
      diff = 99
      break
    default:
      throw new Error('Level is supposed to be basic, advanced, expert, master, re:master or all (or use 0~4/99 to replace)')
  }

  let records = []

  // If all records are requested: 
  if (diff == 99) {
    let tmp = {
      token: token,
      records: {}
    }
    for (let i = 0; i < 5; i++) {
      tmp = await record(tmp.token, i)
      records = records.concat(tmp.records)
    }
    return {
      records: records,
      token: tmp.token
    }
  }

  // Request
  let networkrequest = await axios.get(`https://maimai.wahlap.com/maimai-mobile/record/musicGenre/search/?genre=99&diff=${diff}`, {
    headers: {
      Cookie: `_t=${token.ult}; userId=${token.userId}`
    }
  })

  // Get token
  let cookieori = networkrequest.headers['set-cookie']
  let cookie = {}
  for (let i in cookieori) {
    cookie[cookieori[i].split('; ')[0].split('=')[0]] = cookieori[i].split('; ')[0].split('=')[1]
  }
  if (!cookie.userId) {
    let doc = new dom().parseFromString(networkrequest.data)
    throw new Error(`The server return an error: ${xpath.select(`string(//div[@class='p_5 f_12 gray break'])`, doc)}`)
  }
  
  // Parse webpage content
  let doc = new dom().parseFromString(networkrequest.data);
    
  const scores = xpath.select('//div[@class="music_score_block w_120 t_r f_l f_12"]', doc)

  for (const score of scores) {
    let record_data = {
      title: '',
      level: '',
      diff: diff,
      type: '',
      achievements: 0,
      dxScore: 0,
      rate: '',
      fc: '',
      fs: ''
    }
    const docId = score.parentNode.parentNode.parentNode.getAttribute('id')
    if (docId) {
      record_data.type = docId.match(/(.*)_/)[1]
      if (record_data.type == 'sta') record_data.type = 'standard';
    } else {
      record_data.type = score.parentNode.parentNode.nextSibling.nextSibling.getAttribute("src").match('_(.*).png')[1]
    }
    record_data.achievements = parseFloat(score.textContent)
    let currentNode = score.previousSibling.previousSibling;
    record_data.title = currentNode.textContent;
    currentNode = currentNode.previousSibling.previousSibling;
    record_data.level = currentNode.textContent;
    currentNode = score.nextSibling.nextSibling;
    record_data.dxScore = parseInt(currentNode.textContent.replace(',', ''))
    currentNode = currentNode.nextSibling.nextSibling;
    record_data.fs = currentNode.getAttribute("src").match('_icon_(.*).png')[1].replace("back", "");
    currentNode = currentNode.nextSibling.nextSibling;
    record_data.fc = currentNode.getAttribute("src").match('_icon_(.*).png')[1].replace("back", "");
    currentNode = currentNode.nextSibling.nextSibling;
    record_data.rate = currentNode.getAttribute("src").match('_icon_(.*).png')[1]
    records.push(record_data);
  }

  return {records: records, token: {ult: cookie['_t'], userId: cookie['userId']}}
}