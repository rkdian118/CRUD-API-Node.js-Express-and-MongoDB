const {
    spawn
} = require('child_process');
const path = require('path');
const cron = require('node-cron');
const {
    google
} = require('googleapis');
const fs = require('fs');
var moment = require("moment")

var DATE = moment().format("D");
const DB_NAME = "test";
const ARCHIVE_PATH = path.join(__dirname, '../public/' + DATE + '.gzip');
const ID_OF_THE_FOLDER = '1WBIN8np6rqc0O80wOpSCB7dG6K9Y26IW';
const pageToken = null;
const CLIENT_ID = '927800886891-7g17hfifca7m6t3kvv80dsb4652vnacm.apps.googleusercontent.com'
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

//refresh token
const REFRESH_TOKEN = '1//04w_6eQSc63t_CgYIARAAGAQSNwF-L9Ir0pSHgSeth7WMxAEN5aomq9NKGXmOjss9wF4X8oI5pXVkYqD8FT3cmWCgr0RzX1VMkMA';

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


cron.schedule('*/5 * * * * *', () => uploadFile());

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

        const child = await spawn('C:/Program Files/MongoDB/Tools/100/bin/mongodump', [
            `--db=${DB_NAME}`,
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
                    mimeType: 'test/gzip',
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
                    mimeType: 'test/gzip',
                    body: fs.createReadStream(ARCHIVE_PATH),
                }
            })
            console.log('updates ', updated.data);
        }
    } catch (error) {
        console.log(error);
    }
};