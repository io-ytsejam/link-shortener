package main

import (
	"bufio"
	"github.com/gin-gonic/gin"
	"github.com/mandrigin/gin-spa/spa"
	"math/rand"
	"net/http"
	"os"
	"strings"
)

func main() {
	r := gin.Default()

	r.POST("/api", func(c *gin.Context) {
		q := c.Request.URL.Query()
		link := q.Get("link")
		set := readLinks()

		for id, v := range set {
			if v == link {
				c.String(http.StatusOK, id)
				return
			}
		}

		id := getUniqueIdForSet(set)

		if link == "" {
			c.String(http.StatusBadRequest, "Link must be provided")
		}

		if saveLink(link, id) != 0 {
			c.String(http.StatusInternalServerError, "Link was not saved")
		}

		c.String(http.StatusCreated, id)
	})

	r.GET("/:id", func(c *gin.Context) {
		id := c.Param("id")
		links := readLinks()

		if links == nil {
			c.String(http.StatusBadRequest, "Service is unavailable right now")
		}

		url := links[id]

		if url == "" {
			c.String(http.StatusBadRequest, "There is not such link")
		}

		c.Redirect(http.StatusFound, url)
	})

	r.Use(spa.Middleware("/", "../frontend/build"))

	r.Run()
}

func getUniqueIdForSet (set map[string]string) string {
	id := generateRandomBase62String()
	for set[id] != "" {
		id = generateRandomBase62String()
	}

	return id
}

func generateRandomBase62String() string {
	chars := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	randomString := ""

	for i := 0; i < 5; i++ {
		randomString += string(chars[rand.Intn(62)])
	}

	return randomString
}

func readLinks() map[string]string {
	file, err := os.Open("data.txt")
	var linkPairs map[string]string
	linkPairs = make(map[string]string)

	if err != nil {
		return linkPairs
	}

	defer file.Close()
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		text := scanner.Text()
		semicolonPos := strings.LastIndex(text, ";")
		link := text[0:semicolonPos]
		id := text[semicolonPos+1:]

		linkPairs[id] = link
	}

	if err := scanner.Err(); err != nil {
		return nil
	}

	return linkPairs
}

func saveLink(link string, id string) int {
	f, err := os.OpenFile("data.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if err != nil {
		return -1
	}

	defer f.Close()

	_, writeError := f.WriteString( link + ";" + id + "\n")

	if writeError != nil {
		return -1
	}

	return 0
}
