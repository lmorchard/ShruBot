import fs from "fs/promises";
import Mastotron from "mastotron";
import { MarkovGeneratorWord } from "./markovword.js";

const readTextFile = async (name) => fs.readFile(name, { encoding: "utf8" });

export default class ShruBot extends Mastotron {
  static lastPostDataName = "shrubot-lastpost";

  static configSchema = {
    postInterval: {
      doc: "Minimum time to wait between posting messages",
      env: "POST_INTERVAL",
      type: Number,
      default: 1000 * 60 * 60, // 1 hour
    },
  };

  logBot() {
    const { logger } = this;
    return logger.log({ module: "shrubot" });
  }

  async init() {
    const markovFile = new URL("./markov.json", import.meta.url);
    this.markov = new MarkovGeneratorWord(1, 9);
    this.markov.fromJSON(await readTextFile(markovFile));
  }

  generateText() {
    const out = [];
    const lines = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < lines; i++) {
      out.push(this.markov.generate());
    }
    return out.join("\n");
  }

  async onInterval() {
    const { lastPostDataName } = this.constructor;
    const { config } = this;

    const log = this.logBot();
    log.trace({ msg: "interval" });

    await this.bot.scheduleCallback(
      "lastPostTime",
      lastPostDataName,
      config.get("postInterval"),
      async () => {
        log.info({ msg: "posting a new creation" });
        await this.client.postStatus({
          status: this.generateText(),
          visibility: "public",
        });    
      }
    )
  }

  async onFavorited({ created_at, account, status }) {
    const log = this.logBot();
    const { acct } = account;
    const { id, visibility } = status;

    log.info({ msg: "favorited", created_at, acct });

    if (Math.random() < 0.75) return;

    const resp = this.client.postStatus({
      status: `@${acct} My android heart goes out to you!`,
      visibility,
      in_reply_to_id: id,
    });
    log.trace({ msg: "postedReply", resp });
  }

  async onBoosted({ created_at, account, status }) {
    const log = this.logBot();
    const { acct } = account;
    const { id, visibility } = status;

    log.info({ msg: "boosted", created_at, acct });

    if (Math.random() < 0.75) return;

    const resp = this.client.postStatus({
      status: `@${acct} The Priests boost your name on this night!`,
      visibility,
      in_reply_to_id: id,
    });
    log.trace({ msg: "postedReply", resp });
  }
}
