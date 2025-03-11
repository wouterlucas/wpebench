/**
 * Generate a combined benchmark HTML page.
 *
 * @param {string} setup - Setup JavaScript code.
 * @param {string} optionA - JavaScript code for Option A.
 * @param {string} optionB - JavaScript code for Option B.
 * @param {string} teardown - Teardown JavaScript code.
 * @param {Array<string>} libraries - Array of library filenames to include.
 * @returns {string} - Full HTML as a string.
 */
const generateBenchmarkHtml = (setup, optionA, optionB, teardown, libraries = []) => {
    const libraryScripts = libraries.map(src => `<script src="/libs/${src}"></script>`).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Benchmark Test</title>
    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
    <script src="./libs/benchmark.js"></script>
</head>
<body>
    <h1>Benchmark Running...</h1>
    <script>
        try {
            ${setup}

            const suite = new Benchmark.Suite();

            suite
                .add('Option A', function() {
                    ${optionA}
                })
                .add('Option B', function() {
                    ${optionB}
                })
                .on('cycle', function(event) {
                    console.log(String(event.target));
                })
                .on('complete', function() {
                    console.log('Fastest is ' + this.filter('fastest').map('name'));
                    ${teardown}
                })
                .run({ 'async': true });

        } catch (error) {
            console.error('Benchmark error:', error);
        }
    </script>
</body>
</html>`;
};

module.exports = {
    generateBenchmarkHtml
};
