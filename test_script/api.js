const axios = require('axios')

;(async () => {
  console.log('he2')
  const user = await axios.post('http://localhost:1337/api/auth/local', {
    identifier: 'bidoubiwa@bidoubiwa.com',
    password: 'bidoubiwa',
  })

  const { data } = await axios.post(
    'http://localhost:1337/api/restaurants',
    {
      data: {
        title: `my article ${Math.round(Math.random(100000) * 100000)}`,
        description: 'my super article content',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${user.data.jwt}`,
      },
    }
  )

  console.log(data)
})()
