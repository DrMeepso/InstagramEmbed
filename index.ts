import { getCookie, igApi } from 'insta-fetcher';
import express, { json } from 'express';
import mustache from "mustache"
import fs from "fs/promises"
import cors from "cors"

import { Username, Password, DeploymetURL } from './login.json'
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

app.use(cors())

app.get("/", async (req, res) => {

    let motd = [
        "🏳️‍⚧️",
        "Instagram should add this by default",
        "Hello Opposum",
        "Im watching you 👀",
        "I'm Broke",
        "Uhhhhh",
        "Gatekeep, Gaslight, Girlboss!",
    ]

    let MOTD = motd[Math.floor(Date.now() / 10000) % motd.length]

    res.send(`Instagam Embeder! \n"${MOTD}"\nGithub: <a href="https://github.com/DrMeepso/InstagramEmbed">https://Github.com</a>`)

})

app.get("/p/:id/:offset/:any", async (req, res) => {Embed(req, res)})
app.get("/p/:id/:offset", async (req, res) => {Embed(req, res)})
app.get("/p/:id", async (req, res) => {Embed(req, res)})

async function Embed(req: any, res: any) {

    if (igInfo.ig == undefined) {
        res.send("Not logged in!")
        return;
    }

    let id = req.params.id;
    let offset = req.params.offset != undefined ? parseInt(req.params.offset) : 0;

    let html = await getVideoHTML(id, offset)

    res.send(html)

}

app.get("/uwu/:id/:offset", async (req, res) => {


    if (igInfo.ig == undefined) {
        res.send("Not logged in!")
        return;
    }

    let id = req.params.id;
    let offset = parseInt(req.params.offset);

    let data = await getVideoUWU(id, offset)

    res.send(data)


})

async function getVideoInfo(id: string, offset: number = 0) {
    
    try {

        let videoInfoInsta: IPostModels = await getVideo(`https://www.instagram.com/p/${id}/`)
        offset = offset != undefined && offset <= videoInfoInsta.links.length-1 ? 0 : offset
        let video = videoInfoInsta.links[offset]

        if (video == undefined) {
            throw new Error("Invalid offset, or video does not exist!")
        }

        return {
            videoInfoInsta,
            video
        }

    } catch(e) {
        throw new Error("Video does not exist!")
    }

}

async function getVideoHTML(id: string, offset: number = 0) {

    var videoInfoInsta, video

    try {
        let data = await getVideoInfo(id, offset)
        videoInfoInsta = data.videoInfoInsta
        video = data.video
    } catch(e) {
        return "Invalid offset, or video does not exist!"
    }

    const mustacheContext = {

        videoInfo: {
            creator: videoInfoInsta.username,
            original_url: `https://www.instagram.com/p/${id}/`,
            description: videoInfoInsta.caption
        },

        vFormat: {

            width: video.dimensions.width,
            height: video.dimensions.height,

        },

        mp4URL: video.url,
        oembedURL: DeploymetURL + "/uwu/" + id + "/" + offset,

        // true if photo, false if video
        photo: video.type != "video",
        video: video.type == "video",

    }

    let template = await fs.readFile("./embed.mustache", "utf-8")

    let html = mustache.render(template, mustacheContext)

    return html
    
}

async function getVideoUWU(id: string, offset: number = 0) {

    let { videoInfoInsta, video } = await getVideoInfo(id, offset)

    console.log(videoInfoInsta)

    // first 20 characters of the caption
    let description = videoInfoInsta.caption!.substring(0, 50) + (videoInfoInsta.caption!.length > 50 ? "..." : "")
    let StatsLine = `❤️ ${videoInfoInsta.likes} \n💬 ${videoInfoInsta.comment_count} \n${description}`

    let data = JSON.stringify({

        "author_name": StatsLine,
        "author_url": `https://www.instagram.com/p/${id}/`,
        "provider_name": "Instagram",
        "provider_url": "https://www.instagram.com/",
        "type": "video",
        "width": video.dimensions.width,
        "height": video.dimensions.height,
        "url": video.url,
        "title": "Instagram Video",
        "description": videoInfoInsta.caption,

    })


    console.log(data)
    return data

}

app.listen(3000, () => {
    console.log("Listening on port 3000!")
})