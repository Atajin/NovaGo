import fs from "fs";
import bcrypt from "bcrypt";
const saltRounds = 10

let passwords = [
    'LumiereStellaire21$',
    'RoverRouge82#',
    'Venussien2024!',
    'JupiterJumper88*',
    'SaturneRingz4$',
    'AquaExplorer7%',
    'CrystalMountain22&',
    'ElectroStorm99@',
    'ElysiumDream33$',
    'VortexVisionary5*'
];

async function encryptList(passwords, saltRounds) {
    for (let password of passwords) {
        const hashedPassword = await encryptPassword(password, saltRounds);
        let line = `${password} => ${hashedPassword}\n`;
        console.log(line);
        fs.appendFile('output.txt', line, (err) => {
            if (err) throw err;
            console.log('Les données ont été ajoutées au fichier');
        });
    }
}

async function encryptPassword(password, saltRounds) {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch (err) {
        console.error(err.message);
        return null;
    }
}

encryptList(passwords, saltRounds);

