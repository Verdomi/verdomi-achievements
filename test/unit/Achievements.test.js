const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Achievements Unit Tests", function () {
          let achievements, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["achievements"])
              achievements = await ethers.getContract("Achievements")
          })

          describe("Construtor", () => {
              it("Initilizes the NFT Correctly.", async () => {
                  const name = await achievements.name()
                  const symbol = await achievements.symbol()
                  assert.equal(name, "Verdomi Achievements")
                  assert.equal(symbol, "ACVMT")
              })
          })

          describe("setTokenURI", () => {
              it("Changes the URI for the tokenID", async () => {
                  const tokenId = 0
                  const uriBefore = await achievements.uri(tokenId)
                  await achievements.setTokenURI(tokenId, "newURI")
                  const uriAfter = await achievements.uri(tokenId)

                  assert.equal(uriBefore, "")
                  assert.equal(uriAfter, "newURI")
              })
              it("Reverts if not owner", async () => {
                  const tokenId = 0
                  const playerConnectedAchievements = achievements.connect(player)
                  await expect(playerConnectedAchievements.setTokenURI(tokenId, "newURI")).to.be
                      .reverted
              })
          })

          describe("grantAchievement", () => {
              it("Mints token correctly", async () => {
                  const tokenId = 0
                  const balanceBefore = await achievements.balanceOf(deployer.address, tokenId)
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  const balanceAfter = await achievements.balanceOf(deployer.address, tokenId)
                  assert.equal(balanceBefore.toString(), "0")
                  assert.equal(balanceAfter.toString(), "1")
              })
              it("Reverts if not allowed", async () => {
                  const tokenId = 0
                  await expect(
                      achievements.grantAchievement(deployer.address, tokenId)
                  ).to.be.revertedWith("AllowedAddresses: caller is not allowed")
              })
          })

          describe("Burn", () => {
              it("Removes from sender balance", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  const balanceBefore = await achievements.balanceOf(deployer.address, tokenId)
                  await achievements.burn(deployer.address, 0, 1)
                  const balanceAfter = await achievements.balanceOf(deployer.address, tokenId)
                  assert.equal(balanceBefore.toString(), "1")
                  assert.equal(balanceAfter.toString(), "0")
              })
              it("Reverts if account is not sender", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  const playerConnectedAchievements = achievements.connect(player)
                  await expect(
                      playerConnectedAchievements.burn(deployer.address, 0, 1)
                  ).to.be.revertedWith("Achievements__SenderIsNotOwner")
              })
              it("Reverts if not enough balance", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  await expect(achievements.burn(deployer.address, 0, 2)).to.be.reverted
              })
          })

          describe("setApprovalForAll", () => {
              it("Reverts", async () => {
                  await expect(
                      achievements.setApprovalForAll(player.address, true)
                  ).to.be.revertedWith("Achievements__TransfersAreNotAllowed")
              })
          })

          describe("safeTransferFrom", () => {
              it("Reverts", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)

                  await expect(
                      achievements.safeTransferFrom(
                          deployer.address,
                          player.address,
                          tokenId,
                          1,
                          "0x"
                      )
                  ).to.be.revertedWith("Achievements__TransfersAreNotAllowed")
              })
          })

          describe("safeBatchTransferFrom", () => {
              it("Reverts", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  await achievements.grantAchievement(deployer.address, tokenId + 1)

                  await expect(
                      achievements.safeBatchTransferFrom(
                          deployer.address,
                          player.address,
                          [0, 1],
                          [1, 1],
                          "0x"
                      )
                  ).to.be.revertedWith("Achievements__TransfersAreNotAllowed")
              })
          })

          describe("removeAllowed", () => {
              it("Removes from allowed list as expected", async () => {
                  const tokenId = 0
                  await achievements.addAllowed(deployer.address)
                  await achievements.grantAchievement(deployer.address, tokenId)
                  await achievements.removeAllowed(deployer.address)
                  await expect(
                      achievements.grantAchievement(deployer.address, tokenId)
                  ).to.be.revertedWith("AllowedAddresses: caller is not allowed")
              })
          })

          describe("isAllowed", () => {
              it("Returns the correct value", async () => {
                  const wayBefore = await achievements.isAllowed(deployer.address)
                  await achievements.addAllowed(deployer.address)
                  const before = await achievements.isAllowed(deployer.address)
                  await achievements.removeAllowed(deployer.address)
                  const after = await achievements.isAllowed(deployer.address)
                  assert.equal(wayBefore, false)
                  assert.equal(before, true)
                  assert.equal(after, false)
              })
          })
      })

/*



-------------------
      DONE
-------------------
setTokenURI
should change the uri for the tokenid
reverts if not owner

grantachievement
should mint token with id to address
revert if not allowed

burn
should remove from balance of sender
revert if account is not sender
revert if not enough balance

setapprovalforall
should revert

safetransferfrom
should revert

batchtransferfrom
should revert

*/
