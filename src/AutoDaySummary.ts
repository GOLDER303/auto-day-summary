import fs from "fs"

const TARGET_FILE_PATH = "2023-07-18.md"

try {
    const categoryMapFile = fs.readFileSync("CategoryMap.json")
    const categoryMap = new Map<string, string>(Object.entries(JSON.parse(categoryMapFile.toString())))

    const targetFile = fs.readFileSync(TARGET_FILE_PATH, "utf-8").toString()

    const timePattern = /\d{1,2}:\d{2}/
    let timeStamps: [number, string, string][] = []

    let lines: string[]
    if (targetFile.includes("\r")) {
        lines = targetFile.split("\r\n")
    } else {
        lines = targetFile.split("\n")
    }

    lines.forEach((line, index) => {
        const match = line.match(timePattern)
        if (match) {
            let matchedKey = false
            categoryMap.forEach((_, key) => {
                if (line.endsWith(key)) {
                    timeStamps.push([index, match[0], key])
                    matchedKey = true
                }
            })

            if (!matchedKey) {
                timeStamps.push([index, match[0], "OTH"])
            }
        }
    })

    for (let i = 1; i < timeStamps.length; i++) {
        const [startHour, startMinute] = timeStamps[i - 1][1].split(":").map(Number)
        const [endHour, endMinute] = timeStamps[i][1].split(":").map(Number)

        const startDate = new Date()
        startDate.setHours(startHour, startMinute, 0)

        const endDate = new Date()
        endDate.setHours(endHour, endMinute, 0)

        const timeDifference = Math.abs(endDate.getTime() - startDate.getTime())
        const minutesDifference = Math.floor(timeDifference / 1000 / 60)

        const hours = Math.floor(minutesDifference / 60)
        const minutes = minutesDifference % 60

        lines[timeStamps[i - 1][0]] += ` -> ${hours} h ${minutes} min`
    }

    fs.writeFileSync(TARGET_FILE_PATH, lines.join("\n"))
} catch (error) {
    console.error(error)
}
