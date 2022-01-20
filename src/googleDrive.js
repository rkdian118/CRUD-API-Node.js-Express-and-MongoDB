const {
    spawn
} = require('child_process');
const path = require('path');
const cron = require('node-cron');
const {
    google
} = require('googleapis');
const fs = require('fs');
var moment = require("moment");
// Configuring the google
const dbConfig = require('./config/database.config.js');
var DATE = moment().format("D");
const DB_NAME = dbConfig.db_name;
const ARCHIVE_PATH = path.join(__dirname, '../public/' + DATE + '.gzip');

const ID_OF_THE_FOLDER = dbConfig.folder_id;
const pageToken = null;
const CLIENT_ID = dbConfig.client_id;
const CLIENT_SECRET = dbConfig.client_secret;
const REDIRECT_URI = dbConfig.redrict_url;

//refresh token
const REFRESH_TOKEN = dbConfig.refresh_token;

//intialize auth client
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

//setting outr credentials
oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

//initialize google drive
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});


cron.schedule('0 0 * * *', () => uploadFile());
cron.schedule('10 0 * * *', () => createFile());

cron.schedule('* * * * *', () => uploadFile());
cron.schedule('*/35 * * * * *', () => createFile());

//function to upload the file
const uploadFile = async () => {
    try {

        // var fileMetadata = {
        //     'name': 'database_bkup',
        //     'mimeType': 'application/vnd.google-apps.folder'
        //   };
        //   drive.files.create({
        //     resource: fileMetadata,
        //     fields: 'id'
        //   }, function (err, file) {
        //     if (err) {
        //       // Handle error
        //       console.error(err);
        //     } else {
        //       console.log('Folder Id: ', file.data);
        //     }
        //   });

        const listed = await drive.files.list({
            q: `'${ID_OF_THE_FOLDER}' in parents and trashed=false`,
            fields: 'nextPageToken, files(id, name, mimeType)',
            spaces: 'drive',
            pageToken: pageToken
        });
        let obj = listed.data.files.find(o => o.name === DATE + '.gzip');

        if (!obj) {
            const created = await drive.files.create({
                resource: {
                    name: DATE + '.gzip',
                    parents: [ID_OF_THE_FOLDER]
                },
                media: {
                    mimeType: 'trading-app/gzip',
                    body: fs.createReadStream(ARCHIVE_PATH),
                },
            });
            console.log('creates ', created.data);
        } else {
            let updated = await drive.files.update({
                fileId: obj.id,
                resource: {
                    name: DATE + '.gzip',
                },
                media: {
                    mimeType: 'trading-app/gzip',
                    body: fs.createReadStream(ARCHIVE_PATH),
                }
            })
            console.log('updates ', updated.data);
        }
    } catch (error) {
        console.log(error);
    }
};

//function to upload the file
const createFile = async () => {
    try {
        const child = await spawn('../mongodump.exe', [
            `--uri=mongodb+srv://dev-user:dxJyqOFYtg6rcwEA@cluster0.qffiq.mongodb.net/trading-app`,
            `--archive=${ARCHIVE_PATH}`,
            '--gzip'
        ]);

        await child.stdout.on('data', (data) => {
            console.log('stdout:/n', data)
        })


        await child.stderr.on('data', (data) => {
            console.log('stderr:/n', Buffer.from(data).toString());
        })


        await child.on('error', (error) => {
            console.log('error:/n', error)
        })


        await child.on('exit', (code, signal) => {
            if (code) console.log('exit code ', code)
            else if (signal) console.log('signal ', signal)
            else console.log('backup done');
        });

    } catch (error) {
        console.log(error);
    }
};