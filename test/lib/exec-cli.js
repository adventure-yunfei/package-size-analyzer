import path from 'path';
import child_process from 'child_process';

function execCmd(cmd) {
    return new Promise(function (resolve, reject) {
        var isFinished = false;
        function doFinish(resolver, arg) {
            if (!isFinished) {
                resolver(arg);
                isFinished = true;
            }
        }
        var cmdParts = cmd.split(/\s+/),
            cp = child_process.spawn(cmdParts[0], cmdParts.slice(1), {
                stdio: 'pipe'
            });
		var output = '';
		cp.stdout.on('data', function (d) { output += d.toString(); });
		cp.stderr.on('data', function (d) { output += d.toString(); });
		cp.on('close', function (code, signal) { doFinish(code === 0 ? resolve : reject, output); });
        cp.on('error', function (err) { doFinish(reject, err); });
    });
}

const cliFile = path.resolve(__dirname, '../../lib/cli.js');

export default function execCLI(extraArgs = '') {
    return execCmd(`node ${cliFile} ${extraArgs}`);
}
