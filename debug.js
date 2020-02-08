const api = require('./index')

main()

async function main(){
  let sth = await api.recent({ ult: '5fd232283ad3405e5e9cb9bff1cea187', userId: '2308974580094250' })
  console.log(sth.result)
  console.log(sth.token)
}