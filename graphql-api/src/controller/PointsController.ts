import { Controller, Mutation, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { Points } from '../entity/Points';
import { User } from '../entity/User';
import { CurrentUser } from '../CurrentUser';

@Controller()
export class PointsController {

  constructor(private entityManager: EntityManager, private currentUser: CurrentUser) {
  }

  // serves "points: [Points]" requests
  @Query()
  async points() {
    return this.entityManager.getRepository(Points).createQueryBuilder("points")
      .innerJoin("points.user", "user", "user.id = :id", { id: this.currentUser.id })
      .getMany();
    //return this.entityManager.find(Points);
  }

  // serves "pointsGet(id: Int): Points" requests
  @Query()
  pointsGet({id}) {
    return this.entityManager.findOne(Points, id);
  }

  // serves "pointsSave(id: Int, date: Date, : String, text: String): Points" requests
  @Mutation()
  pointsSave(args) {
    // add current user to points saved
    if (this.currentUser) {
      const user = new User();
      user.id = this.currentUser.id;
      args.user = user;
    }

    const points = this.entityManager.create(Points, args);
    return this.entityManager.save(Points, points);
  }

  // serves "pointsDelete(id: Int): Boolean" requests
  @Mutation()
  async pointsDelete({id}) {
    await this.entityManager.remove(Points, {id: id});
    return true;
  }

}
