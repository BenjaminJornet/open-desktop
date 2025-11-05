#include <iostream>
#include <cstdlib>
#include <cstring>

extern char **environ;

int main() {
    // Iterate through all environment variables
    for (char **env = environ; *env != nullptr; ++env) {
        // Print the environment variable followed by null terminator
        std::cout << *env << '\0';
    }
    
    return 0;
}
