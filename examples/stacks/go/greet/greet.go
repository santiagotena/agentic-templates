// Package greet provides a small example used by the Go stack overlay.
package greet

import "fmt"

// Greet returns a greeting for name.
func Greet(name string) string {
	if name == "" {
		name = "world"
	}
	return fmt.Sprintf("Hello, %s!", name)
}
