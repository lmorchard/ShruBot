#!/usr/bin/env node
import fs from "fs/promises";
import Mastotron from "mastotron";
import { MarkovGeneratorWord } from "./markovword.js";

const readTextFile = async (name) => fs.readFile(name, { encoding: "utf8" });

class ShruBot extends Mastotron {
  static lastPostDataName = "shrubot-lastpost";

  configSchema() {
    return {
      ...super.configSchema(),
      postInterval: {
        doc: "Minimum time to wait between posting messages",
        env: "POST_INTERVAL",
        type: Number,
        default: 1000 * 60 * 60, // 1 hour
      },
    };
  }

  logBot() {
    return this.log({ module: "shrubot" });
  }

  async init() {
    await super.init();

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

    // First, ensure we're not posting too often
    const now = Date.now();
    const { lastPostTime = 0 } = await this.loadJSON(lastPostDataName);
    const sinceLastPost = now - lastPostTime;
    const minSinceLast = config.get("postInterval");
    if (sinceLastPost < minSinceLast) {
      log.trace({
        msg: "skipping post this interval",
        lastPostTime,
        sinceLastPost,
        minSinceLast,
      });
      return;
    }

    log.info({ msg: "posting a new creation" });
    const resp = this.postStatus({
      status: this.generateText(),
      visibility: "public",
    });
    log.trace({ msg: "postedReply", resp });

    await this.updateJSON(lastPostDataName, { lastPostTime: now });
  }

  async onFavorited({ created_at, account, status }) {
    const log = this.logBot();
    const { acct } = account;
    const { id, visibility } = status;

    log.info({ msg: "favorited", created_at, acct });

    if (Math.random() < 0.75) return;

    const resp = this.postStatus({
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

    const resp = this.postStatus({
      status: `@${acct} The Priests boost your name on this night!`,
      visibility,
      in_reply_to_id: id,
    });
    log.trace({ msg: "postedReply", resp });
  }
}

await new ShruBot().run();
