// Import frameworks
const axios = require('axios')
const xpath = require('xpath')
const dom = require('xmldom').DOMParser

module.exports = async token => {
  // Get cookie token from database
  // Node: write the error feedback in catch 

  // Get game data
  let networkrequest = await axios.get('https://maimai.wahlap.com/maimai-mobile/playerData/', {
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
  let doc = new dom().parseFromString(networkrequest.data)

  // Username & check error
  let username
  try { username = await (xpath.select(`//div[@class='name_block f_l f_14']`, doc))[0].firstChild.data } catch (e) { throw new Error('Expired or incorrect token pair') }

  // DX Rating
  let dxrating = (xpath.select(`//div[@class='rating_block f_11']`, doc))[0].firstChild.data
  let dxmax = (xpath.select(`//div[@class='p_r_5 f_11']`, doc))[0].firstChild.data
  dxmax = dxmax.split('：')[1]

  // Grades
  let grades_row = xpath.select(`//div[@class='musiccount_counter_block f_13']`, doc)
  for (let i in grades_row) grades_row[i] = grades_row[i].firstChild.data
  grades_dict = ['sssp', 'app', 'sss', 'ap', 'ssp', 'fcp', 'ss', 'fc', 'sp', 'fdxp', 's', 'fdx', 'clear', 'fsp', 'fs']
  let grades = {}
  for (let i in grades_row) { grades[grades_dict[i]] = grades_row[i].split('/')[0] }
  grades['total'] = grades_row[13].split('/')[1]

  // Appellation
  let appellation = xpath.select(`//div[@class='trophy_inner_block f_13']/span`, doc)[0].firstChild.data

  // Game time
  let gametime = xpath.select(`//div[@class='m_5 m_t_10 t_r f_12']`, doc)[0].firstChild.data
  gametime = gametime.split('：')[1]

  // Partner Stars
  let stars = xpath.select(`string(//div[@class='p_l_10 f_l f_14'])`, doc)
  stars = stars.split('×')[1]

  let result = {username, dxrating, dxmax, gametime, appellation, stars, grades}

  return {result, token: {ult: cookie['_t'], userId: cookie['userId']}}
}