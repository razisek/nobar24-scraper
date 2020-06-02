const fetch = require('node-fetch');
var cheerio = require('cheerio');
const readlineSync = require('readline-sync');
var Spinner = require('cli-spinner').Spinner;

const short = (link) => new Promise((resolve, reject) => {
    fetch('https://tinyurl.com/api-create.php?url='+encodeURIComponent(link) , {
      method: 'GET',
      timeout: 10000
    }).then(async res => {
      resolve(res.text())
    }).catch(err => reject(err))
});
  
const getFilm = (judul) => new Promise((resolve, reject) =>{
    fetch(`http://nobar24.cc/?s=${judul.replace(/\s/g, "+")}`, {
        method: 'GET',
        headers: {
            "User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0",
        }
    }).then(async res => {
        const page = await res.text();
        const $ = cheerio.load(page);
        // const judul = $('div[class="ml-item"] a').attr('title');
        const kualitas = $('div[class="ml-item"] a span').html();
        const link = $('div[class="ml-item"] a').attr('href');
        let judul = [];
        $('div[class="ml-item"] a').each(function() {
            var title = $(this).attr('title');
            var link = $(this).attr('href')
            judul.push({title : title, url : link})
        })
        resolve(judul);
    }).catch(err => reject(err));
});
const getDescFIlm = (link) => new Promise((resolve, reject) => {
    fetch(link, {
        method: 'GET',
        headers: {
            "User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0",
        }
    }).then(async res => {
        const page = await res.text();
        const $ = cheerio.load(page);
        const rating = $('span[class="irank-voters"]').html();
        const durasi = $('div[class="mvici-right"] p').first().text();
        const genre = $('div[class="mvici-left"] p').first().text();
        const ress = {
            rate : rating,
            duration : durasi,
            genre : genre,
        }
        resolve(ress);
    }).catch(err => reject(err));
})
const getIDFilm = (link) => new Promise((resolve, reject) => {
    fetch(`${link}play/`, {
        method:'GET',
        headers: {
            "User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0",
        }
    }).then(async res => {
        const page = await res.text();
        const $ = cheerio.load(page);
        const redirect = $('div[id="dlm"] div table tbody a').attr('href');
        if(redirect == undefined){
            resolve(redirect);
        }else{
            const id = redirect.split('/')[4];
            resolve(id);
        }
    }).catch(err => reject(err));
});
const getLinkDown = (id) => new Promise((resolve, reject) => {
    fetch(`https://nobar24.xyz/api/source/${id}`, {
        method: 'POST',
        headers : {
            "Cookie" : "_ym_uid=1591081337717034039; _ym_d=1591081337; _ym_visorc_49788082=b; _ym_isad=2; 494668b4c0ef4d25bda4e75c27de2817=d0340464-7b95-4f26-aa8c-2f0c3112dc5f:2:1; __cfduid=d186f9ce60c7750fdaac2473cb8fee3601591081686; ppu_show_on_456c95f88064d2106d30239a23150d66=4; ppu_main_456c95f88064d2106d30239a23150d66=1; ppu_exp_456c95f88064d2106d30239a23150d66=1591088932795; ppu_sub_456c95f88064d2106d30239a23150d66=4; total_count_456c95f88064d2106d30239a23150d66=1",
            "Accept-Encoding" : "gzip, deflate, br",
            "Accept-Language" : "en-US,en;q=0.5",
            "User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0",
            "Origin" : "https://nobar24.xyz",
            "X-Requested-With" : "XMLHttpRequest"
        }
    }).then(async res => {
        const ress = {
            body : await res.json()
        }
        resolve(ress.body);
    }).catch(err => reject(err));
});
(async () => {
    try{
        console.log('\n-- NOBAR24.CC SCRAPER --\n     -= azisek =-\n')
        while(1)
        {
            try{
                const judul = readlineSync.question('Masukkan Judul Film : ');
                var spinner = new Spinner('sedang proses...%s');
                spinner.setSpinnerString('|/-\\');
                spinner.start();
                const data = await getFilm(judul);
                if(data.length == 0){
                    console.log('\n[ Film Tidak Ditemukan ]');
                }else{
                    let list = [];
                    No = 0
                    for (let i = 0; i < data.length; i++) {
                        list += `${No}. ${data[i].title}\n`;
                        No++
                    }
                    console.log('\nSILAHKAN PILIH JUDUL FILM\n'+list)
                    const nomer = readlineSync.question('Pilih Nomer Film : ');
                    const target = data[nomer].url
                    spinner.start();
                    const desc = await getDescFIlm(target);
                    const id = await getIDFilm(target);
                    if(id == undefined){
                        console.log('\n[ Link Download Tidak Tersedia ]\n [ STREAMING ] => ' +target)
                        spinner.stop();
                    }else{
                        const link = await getLinkDown(id);
                        const down = link.data;
                        let list = [];
                        for (let i = 0; i < down.length; i++) {
                            const pendek = await short(down[i].file);
                            list += `  [${down[i].label}] = ${pendek}\n`;
                        }
                        console.log('\n[ Download Link ]\n'+list)
                        spinner.stop();
                    }
                }
            }catch(err){
                console.log('ERROR => '+err)
                spinner.stop();
            };
        }
    }catch(err){
        console.log('ERROR => '+err)
        spinner.stop();
    };
})();