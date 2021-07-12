import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/lib/util/colors'

import 'vuetify/dist/vuetify.min.css'

import '@/assets/css/tailwind.css'

Vue.use(Vuetify)

const opts = {
  theme: {
    themes: {
      light: {
        primary: '#474747',
        secondary: '#EEEEEE',
        accent: colors.shades.black,
        error: colors.red.accent3,
      },
      dark: {
        primary: colors.blue.lighten3,
      },
    },
  },
}

export default new Vuetify(opts)