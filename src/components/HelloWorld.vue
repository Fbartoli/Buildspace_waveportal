<template>
  <div class="hello">
    <div v-if="ethereum">
      <h1>Welcome {{ userAddress }} {{ msg }}</h1>
      <v-btn v-if="!userAddress" @click="connectToProvider">Connect</v-btn>
      <h3>Wave Count : {{ waveCount }}</h3>
      <h3 v-if="userAddress">You have waved me {{ wavesUserCount }} times</h3>
      <input
        v-if="userAddress"
        v-model="userMessage"
        type:text
        placeholder="leave me a message"
      />
      <v-btn v-if="userAddress" @click="wave">wave</v-btn>
      <h3>Latest messages</h3>
      <table v-if="waves.length > 0">
        <thead>
          <tr>
            <th>From</th>
            <th>Message</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(wave, i) in waves" :key="i">
            <td>{{ wave[0] }}</td>
            <td>{{ wave[1] }}</td>
            <td>{{ new Date(wave[2].toNumber() * 1000) }}</td>
          </tr>
        </tbody>
      </table>
      <h3>Your waves history</h3>
      <table v-if="userWaves.length > 0">
        <thead>
          <tr>
            <th>From</th>
            <th>Message</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(userWave, i) in userWaves" :key="i">
            <td>{{ userWave[0] }}</td>
            <td>{{ userWave[1] }}</td>
            <td>{{ new Date(userWave[2].toNumber() * 1000) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <h1>Make sure to install metamask</h1>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";
import ABI from "../contract/WavePortal";

export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      provider: null,
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
    console.log(data);
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
          console.log("NewWave", from, timestamp, message);
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
  mounted() {},
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
          console.log(data);
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
      let txn = await this.wavePortalContract.wave(this.userMessage);
      await txn.wait();
    },
    getWaveCount: async function () {
      this.waveCount = await this.wavePortalContract.getTotalWaves();
    },
    getAllWaves: async function () {
      this.waves = await this.wavePortalContract.getAllWaves();
    },
    getUserWaves: async function () {
      this.userWaves = await this.wavePortalContract.getWaversData();
    },
    getUserWaveCount: async function () {
      this.wavesUserCount = await this.wavePortalContract.getTotalWavesByUser();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
