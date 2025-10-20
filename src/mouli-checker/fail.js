function parseFailedTasks(output) {
    const headerRegex = /^={20,}\s*\n\s*(Task\d+)\s*\n={20,}\s*\n/gm;
    const headers = [];
    let m;
    while ((m = headerRegex.exec(output)) !== null) {
        headers.push({ name: m[1], headerEnd: headerRegex.lastIndex, startIndex: m.index });
    }

    const failures = [];
    for (let i = 0; i < headers.length; i++) {
        const start = headers[i].headerEnd;
        const end = (i + 1 < headers.length) ? headers[i + 1].startIndex : output.length;
        const block = output.slice(start, end).trim();

        const execIdx = block.indexOf('# Executing all tests...');
        const afterExec = execIdx === -1 ? block : block.slice(execIdx + '# Executing all tests...'.length).trim();

        if (!afterExec.includes('# OK')) {
            failures.push({ task: headers[i].name, content: afterExec });
        }
    }

    return failures;
}

function cleanFailureContent(content) {
    return content
        .split('\n')
        .map(line => line.replace(/^\s*#\s?/, '').trim())
        .filter(line => {
            if (line.length === 0) return false;
            if (/^Task\d+\s*[:\-]?\s*(FAILURE|SUCCESS)?$/i.test(line)) return false;
            if (/^Executing all tests\.{3}/i.test(line)) return false;
            return true;
        })
        .join('\n');
}

export function getFailedOutputText(output) {
    const fails = parseFailedTasks(output);
    if (fails.length === 0) return '';
    return fails.map(f => cleanFailureContent(f.content)).join('\n\n');
}