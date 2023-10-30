import { getCookie, igApi } from 'insta-fetcher';
import express, { json } from 'express';
import mustache from "mustache"
import fs from "fs/promises"

import { Username, Password } from './login.json'
import { IPostModels } from 'insta-fetcher/dist/types';

interface igInfo {
    ig: igApi
};

const igInfo = {} as igInfo;

(async () => {

    const session_id = await getCookie(Username, Password);
    if (!session_id) throw new Error("Invalid session id");
    if (typeof session_id !== "string") throw new Error("Invalid session id");
    let ig: igApi = new igApi(session_id, false);
    igInfo.ig = ig;

    console.log("Logged into instagram!")

})()

async function getVideo(videoURL: string) {

    const regex = /\/p\/([a-zA-Z0-9-_]+)/;
    let matches = await videoURL.match(regex)
    const id = matches![0].length == 11 ? matches![0] : matches![1]

    return await igInfo.ig.fetchPost(`https://www.instagram.com/p/${id}`)

}

const app = express();

app.get("/", async (req, res) => {

    res.send("Trans Rights!")

})

app.get("/p/:id", async (req, res) => {

    if (igInfo.ig == undefined) {
        res.send("Not logged in!")
        return;
    }

    let id = req.params.id;

    let videoInfoInsta: IPostModels = await getVideo(`https://www.instagram.com/p/${id}/`)
    let video = videoInfoInsta.links[0]

    const mustacheContext = {

        videoInfo: {
            creator: videoInfoInsta.username,
            original_url: video.url,
            description: videoInfoInsta.caption
        },

        vFormat: {

            width: video.dimensions.width,
            height: video.dimensions.height,

        },

        mp4URL: video.url

    }

    let template = await fs.readFile("./embed.html", "utf-8")

    let html = mustache.render(template, mustacheContext)

    res.send(html)

})

app.listen(3000, () => {
    console.log("Listening on port 3000!")
})