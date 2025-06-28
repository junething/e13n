> [!Warning]
> This tool is under development and not ready for production use

# E13N Tool
This tool automates the externalisation (e13n) of strings from your codebase into various translation file formats to prepare for localisation.

## How it works.
E13N tool parses your codebase, extracts the strings from code and markup, feeding them into a configurable naming pipeline. This pipeline either dismisses or names each string for externalising into a resource file.
The special part of this pipeline is the included AI namer, which given the string content and code context can give either a final name or suggest something to the programmer operating the tool. This cuts down refactoring times for large codebases from days to minutes, depending on the amount of human intervention.
The program then creates the resource file mapping the names to the strings.
It then inserts code into your source to import the resource file, and replaces the string with a reference to the transation unit in the imported resource object.
## Architecture
The tool is built in functional Typescript as a pipeline of composeable functions. This makes it very flexible, the majority of the pipeline is language agnostic, making it easy to extend to other languages.
## Namers
Currently the available namers are
- Numbered
- Prompt
- LLM (currently a mistral agent)
These can be composed together to, for example, have the LLM give suggestions that are approved manually.
## Installation
WIP
## How to use
WIP

## Funcationality
- [ ] Code handling
	- [x] Parse JS/TS/JSX
		- [x] Extract strings
			- [x] Normal strings
			- [ ] Template strings
			- [ ] JSX Content (WIP)
	- [x] Replace strings in code
	- [x] Console output
	- [ ] File outputs
		- [ ] Export translation templates
			- [ ] POT
		- [ ] Modify code files #MVP
		- [ ] Output/update resource file #MVP
- [ ] Renaming
	- [x] Console Prompt
	- [x] AI naming
		- [x] Mistral agent
		- [ ] BYO AI #MVP
	- [x] Numbered naming
	- [x] 2-stage suggestion->confirmation
- [ ] Option to group duplicates and created combined context #IMPORTANT
	- [ ] Per file deduplicating #IMPORTANT 
	- [ ] Global deduplicating #IMPORTANT 
	- [ ] Prompted grouping / deduplicating #STRECH
- [ ] Save and resume progress
	- Nice to have for very large projects #STRETCH 
