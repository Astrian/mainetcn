// Import frameworks
const axios = require('axios')
const xpath = require('xpath'), dom = require('xmldom').DOMParser

module.exports = async token => {
  // Get cookie token from database
  // Node: write the error feedback in catch 
  // Get game data
  let networkrequest = await axios.get('https://maimai.wahlap.com/maimai-mobile/record/', {
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
  if (!cookie.userId) throw new Error('Expired or incorrect token pair')
  
  // Parse webpage content
  let doc = new dom().parseFromString(networkrequest.data)

  // Game logs
  let logs_row
  try { logs_row = await xpath.select(`//div[@class='p_10 t_l f_0 v_b']`, doc) } catch(e) { throw new Error('Expired or incorrect token pair') }
  let logs = []
  try {
    for (let i in logs_row) {
      logs[i] = new dom().parseFromString(logs_row[i].toString())
      let result = {}
      result.tracknum = (xpath.select(`string(//span[@class='red f_b v_b'])`, logs[i])).split(' 0')[1]
      result.date = (xpath.select(`string(//span[@class='v_b'])`, logs[i]))
      let grade = (xpath.select1(`//img[@class='playlog_scorerank']/@src`, logs[i]).value).split('/')
      result.grade = (grade[grade.length - 1]).split('.')[0]
      result.track = {
        title: (xpath.select(`string(//div[@class='basic_block m_5 p_5 p_l_10 f_13 break'])`, logs[i])),
        dx: (xpath.select1(`//img[@class='playlog_music_kind_icon']/@src`, logs[i]).value) === 'https://maimai.wahlap.com/maimai-mobile/img/music_dx.png',
        coverart: xpath.select1(`//img[@class='music_img m_5 m_r_0 f_l']/@src`, logs[i]).value
      }
      result.achivement = parseFloat((xpath.select(`string(//div[@class='playlog_achievement_txt t_r'])`, logs[i])).split('%')[0])
      result.dxscore = parseInt(xpath.select(`string(//div[@class='white p_r_5 f_15 f_r'])`, logs[i]))
      result.fullcombo = xpath.select1(`//div[@class='playlog_result_innerblock basic_block p_5 f_13']/img[@class='h_35 m_5 f_l']/@src`, logs[i]).value === 'https://maimai.wahlap.com/maimai-mobile/img/playlog/fc.png'
      result.fullsync = !(xpath.select(`//img[@src='https://maimai.wahlap.com/maimai-mobile/img/playlog/fs_dummy.png']`, logs[i]))[0],
      result.identifier = xpath.select1(`//form/input/@value`, logs[i]).value
      logs[i] = result
    }
  } catch (e) {
    console.log('mainetcn has an unexpected error!')
    console.log(e)
  }
  let result = logs
  return {result, token: {ult: cookie['_t'], userId: cookie['userId']}}
}