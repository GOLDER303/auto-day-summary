import fs from "fs"

const TARGET_FILE_PATH = process.argv[2]
if (!TARGET_FILE_PATH) {
    console.error("You must provide target file path!")
    process.exit(9)
}

try {
    const categoryMapFile = fs.readFileSync("CategoryMap.json")
    const categoryMap = new Map<string, string>(Object.entries(JSON.parse(categoryMapFile.toString())))
    categoryMap.set("OTH", "Other")

    const targetFile = fs.readFileSync(TARGET_FILE_PATH, "utf-8").toString()

    let lines: string[]
    if (targetFile.includes("\r")) {
        lines = targetFile.split("\r\n")
    } else {
        lines = targetFile.split("\n")
    }

    const hasDurationPattern = / -> \d+ h \d+ min/
    const timePattern = /\d{1,2}:\d{2}/
    let timeStamps: [number, string, string][] = []

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

            if (!matchedKey && !line.match(hasDurationPattern)) {
                timeStamps.push([index, match[0], "OTH"])
            }
        }
    })

    let activitiesDurations = new Map<string, number>()

    for (let i = 1; i < timeStamps.length; i++) {
        const [startHour, startMinute] = timeStamps[i - 1][1].split(":").map(Number)
        const [endHour, endMinute] = timeStamps[i][1].split(":").map(Number)

        const startDate = new Date()
        startDate.setHours(startHour, startMinute, 0)

        const endDate = new Date()
        endDate.setHours(endHour, endMinute, 0)

        const timeDifference = Math.abs(endDate.getTime() - startDate.getTime())
        const minutesDifference = Math.floor(timeDifference / 1000 / 60)

        const activityKey = timeStamps[i - 1][2]

        const currentDuration = activitiesDurations.get(activityKey)

        activitiesDurations.set(activityKey, (currentDuration || 0) + minutesDifference)

        lines[timeStamps[i - 1][0]] += ` -> ${formatMinutes(minutesDifference)}`
    }

    let summary = "\nSummary:\n"

    activitiesDurations.forEach((duration, activityKey) => {
        summary += `- ${categoryMap.get(activityKey)} -> ${duration} min = ${formatMinutes(duration)}\n`
    })

    fs.writeFileSync(TARGET_FILE_PATH, lines.join("\n") + summary)
} catch (error) {
    console.error(error)
}

function formatMinutes(inputMinutes: number): string {
    const hours = Math.floor(inputMinutes / 60)
    const minutes = inputMinutes % 60
    return `${hours} h ${minutes} min`
}
