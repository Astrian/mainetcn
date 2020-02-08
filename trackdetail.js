// Import frameworks
const axios = require('axios')
const xpath = require('xpath'), dom = require('xmldom').DOMParser

module.exports = async (token, trackid) => {
  if (!trackid) throw new Error('Please provide the track id')
  // Get cookie token from database
  // Node: write the error feedback in catch 
  // Get game data
  let networkrequest = await axios.get(`https://maimai.wahlap.com/maimai-mobile/record/playlogDetail/?idx=${trackid}`, {
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

  // Game logs
  let result = {}
  let basiclogs_row
  try { basiclogs_row = await xpath.select(`//div[@class='p_10 t_l f_0 v_b']`, doc) } catch(e) { throw new Error('Expired or incorrect token pair') }
  let basiclogs = new dom().parseFromString(basiclogs_row[0].toString())
  let grade = (xpath.select1(`//img[@class='playlog_scorerank']/@src`, basiclogs).value).split('/')
  let difficulty = xpath.select1(`//img[@class='playlog_diff v_b']/@src`, doc).value
  result.date = (xpath.select(`string(//span[@class='v_b'])`, basiclogs))
  difficulty = (difficulty.split('diff_')[1]).split('.')[0]
  result.track = {
    title: (xpath.select(`string(//div[@class='basic_block m_5 p_5 p_l_10 f_13 break'])`, basiclogs)),
    dx: (xpath.select1(`//img[@class='playlog_music_kind_icon']/@src`, basiclogs).value) === 'https://maimai.wahlap.com/maimai-mobile/img/music_dx.png',
    coverart: xpath.select1(`//img[@class='music_img m_5 m_r_0 f_l']/@src`, basiclogs).value,
    difficulty
  }
  result.grade = {
    achivement: parseFloat((xpath.select(`string(//div[@class='playlog_achievement_txt t_r'])`, basiclogs)).split('%')[0]),
    dxscore: parseInt(xpath.select(`string(//div[@class='white p_r_5 f_15 f_r'])`, basiclogs)),
    fullcombo: xpath.select1(`//div[@class='playlog_result_innerblock basic_block p_5 f_13']/img[@class='h_35 m_5 f_l']/@src`, basiclogs).value === 'https://maimai.wahlap.com/maimai-mobile/img/playlog/fc.png',
    fullsync: !(xpath.select(`//img[@src='https://maimai.wahlap.com/maimai-mobile/img/playlog/fs_dummy.png']`, basiclogs))[0],
    rank: (grade[grade.length - 1]).split('.')[0]
  }
  let timing = xpath.select(`//div[@class='playlog_fl_block m_b_5 f_r f_12']/div[@class='w_96 f_l t_r']/div[@class='p_t_5']`, doc)
  let tableraw = xpath.select(`//table[@class='playlog_notes_detail t_r f_l f_11 f_b']`, doc)
  tableraw = tableraw[0].toString()
  let table = new dom().parseFromString(tableraw)
  let martix = []
  let column = xpath.select(`//tr`, table)
  for (let i in column){
    if (i !== '0') {
      let row = new dom().parseFromString(column[i].toString())
      row = xpath.select(`//td`, row)
      let innermartix = []
      for (let j in row) {
        if (row[j].toString() === '<td/>') innermartix[innermartix.length] = 0
        else if (!row[j].firstChild.data || row[j].firstChild.data === '　') innermartix[innermartix.length] = 0
        else innermartix[innermartix.length] = parseInt(row[j].firstChild.data)
      }
      martix[martix.length] = innermartix
    }
  }
  let dxrating = xpath.select(`//div[@class='playlog_rating_val_block']`, doc)
  dxrating = dxrating[0].firstChild.data
  let playerrating = xpath.select(`//div[@class='basic_block m_t_5 p_3 t_r f_0']/span[@class='f_14']`, doc)
  playerrating = playerrating[0].firstChild.data
  let combo = xpath.select(`//div[@class='f_r f_14 white']`, doc)
  combo = (combo[0].firstChild.data).split('/')
  let sync = xpath.select(`//div[@class=' f_r f_14 white']`, doc)
  if (sync[0].firstChild.data === '―') sync = ['N/A', 'N/A']
  else sync = (sync[0].firstChild.data).split('/')
  result.analysis = {
    timing: {
      fast: timing[0].firstChild.data,
      late: timing[1].firstChild.data
    },
    note: {
      tap: {
        criticalperfect: martix[0][0],
        perfect: martix[0][1],
        great: martix[0][2],
        good: martix[0][3],
        miss: martix[0][4],
      },
      hold: {
        criticalperfect: martix[1][0],
        perfect: martix[1][1],
        great: martix[1][2],
        good: martix[1][3],
        miss: martix[1][4],
      },
      slide: {
        criticalperfect: martix[2][0],
        perfect: martix[2][1],
        great: martix[2][2],
        good: martix[2][3],
        miss: martix[2][4],
      },
      touch: {
        criticalperfect: martix[3][0],
        perfect: martix[3][1],
        great: martix[3][2],
        good: martix[3][3],
        miss: martix[3][4],
      },
      break: {
        criticalperfect: martix[4][0],
        perfect: martix[4][1],
        great: martix[4][2],
        good: martix[4][3],
        miss: martix[4][4],
      }
    },
    dx: {
      rating: dxrating,
      playerrating
    },
    combo: {
      get: combo[0],
      max: combo[1]
    },
    sync: {
      get: sync[0],
      max: sync[1]
    }
  }
  return {result, token: {ult: cookie['_t'], userId: cookie['userId']}}
}