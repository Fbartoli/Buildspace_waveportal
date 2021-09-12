<template>
  <v-app>
    <v-app-bar app>
      <v-btn v-if="!userAddress" @click="connectToProvider">Connect</v-btn>
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container fluid>
        <div class="hello">
          <div v-if="ethereum">
            <h1>
              Welcome {{ userAddress }} You can wave at me and maybe earn so ETH
            </h1>

            <h3>Wave Count : {{ waveCount }}</h3>
            <h3 v-if="userAddress">
              You have waved me {{ wavesUserCount }} times
            </h3>
            <v-text-field
              v-if="userAddress"
              v-model="userMessage"
              type:text
              placeholder="leave me a message"
            />
            <v-btn
              v-if="userAddress"
              @click="wave"
              class="ma-2"
              :loading="loading"
              :disabled="loading"
              color="secondary"
              >wave</v-btn
            >
            <h3>Latest messages</h3>
            <v-data-table
              v-if="waves.length > 0"
              :headers="wavesHeaders"
              :items="waves"
              :items-per-page="5"
              class="elevation-1"
            >
            </v-data-table>
            <h3 v-if="userWaves.length > 0">Your waves history</h3>
            <v-data-table
              v-if="userWaves.length > 0"
              :headers="wavesHeaders"
              :items="userWaves"
              :items-per-page="5"
              class="elevation-1"
            >
            </v-data-table>
          </div>
          <div v-else>
            <h1>Make sure to install metamask</h1>
          </div>
        </div>
      </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script>
import { ethers } from "ethers";
import ABI from "./contract/WavePortal";

export default {
  name: "App",
  components: {},
  data() {
    return {
      provider: null,
      loading: false,
      signer: null,
      userAddress: null,
      contractAddress: "0xE14f79bB1ee9582c018b0443607D75D5fe697adF",
      ethereum: null,
      wavePortalContract: null,
      waveCount: 0,
      wavesUserCount: 0,
      userMessage: "",
      waves: [],
      userWaves: [],
      wavesHeaders: [
        {
          text: "From",
          align: "center",
          value: "from",
        },
        { text: "Message", value: "msg" },
        { text: "When", value: "when" },
      ],
    };
  },
  async created() {
    this.ethereum = window.ethereum;
    if (!this.ethereum) {
      alert("Metamask is needed");
      return;
    }
    this.ethereum.on("accountsChanged", (accounts) => {
      if (this.userAddress) {
        this.userAddress = null;
        this.userWaves = [];
        this.wavesUserCount = 0;
      }
    });
    this.ethereum.on("disconnect", () => {
      this.userAddress = null;
      this.userWaves = [];
      this.wavesUserCount = 0;
    });
    let data = await this.ethereum.request({ method: "eth_accounts" });
    if (data.length !== 0) {
      this.provider = new ethers.providers.Web3Provider(this.ethereum);
      this.wavePortalContract = new ethers.Contract(
        this.contractAddress,
        ABI.abi,
        this.provider
      );
      await this.getWaveCount();
      await this.getAllWaves();
      this.wavePortalContract.on(
        "NewWave",
        async (from, timestamp, message) => {
          await this.getWaveCount();
          await this.getUserWaveCount();
          await this.getAllWaves();
          await this.getUserWaves();
        }
      );
    } else {
      console.log("No authorized account found");
    }
  },
  methods: {
    connectToProvider: async function () {
      if (!this.ethereum) {
        alert("Metamask is needed");
      }
      this.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then((data) => {
          if (data.length !== 0) {
            this.userAddress = data[0];
          } else {
            console.log("No authorized account found");
          }
        });
      this.signer = await this.provider.getSigner();
      this.wavePortalContract = new ethers.Contract(
        this.contractAddress,
        ABI.abi,
        this.signer
      );
      await this.getUserWaveCount();
      await this.getUserWaves();
    },
    convertBigNumber: function (number) {
      return number.toString() / 1e18;
    },
    wave: async function () {
      this.loading = true;
      let txn = await this.wavePortalContract.wave(this.userMessage);
      await txn.wait();
      this.loading = false;
    },
    getWaveCount: async function () {
      this.waveCount = await this.wavePortalContract.getTotalWaves();
    },
    getAllWaves: async function () {
      let data = await this.wavePortalContract.getAllWaves();
      this.waves = [];
      data.forEach((x) => {
        this.waves.push({
          from: x[0],
          msg: x[1],
          when: new Date(x[2].toNumber() * 1000),
        });
      });
    },
    getUserWaves: async function () {
      let data = await this.wavePortalContract.getWaversData();
      this.userWaves = [];
      data.forEach((x) => {
        this.userWaves.push({
          from: x[0],
          msg: x[1],
          when: new Date(x[2].toNumber() * 1000),
        });
      });
    },
    getUserWaveCount: async function () {
      this.wavesUserCount = await this.wavePortalContract.getTotalWavesByUser();
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
button {
  margin: 5px;
}
table {
  margin-left: auto;
  margin-right: auto;
}
</style>
